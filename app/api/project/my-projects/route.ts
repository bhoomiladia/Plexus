import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Project from "@/models/Project";
import Application from "@/models/Application";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const userId = session.user.id;
    const userEmail = session.user.email;

    console.log("Fetching my-projects for user:", userId, "email:", userEmail);

    // Get projects owned by the user
    const ownedProjects = await Project.find({ ownerId: userId }).sort({ createdAt: -1 });
    console.log("Owned projects:", ownedProjects.length);

    // Get projects where user has been accepted as a member
    const acceptedApplications = await Application.find({ 
      $or: [
        { userId: userId },
        { userEmail: userEmail }
      ],
      status: "ACCEPTED" 
    }).select("projectId");

    const acceptedProjectIds = acceptedApplications.map(app => app.projectId);
    const memberProjects = await Project.find({ 
      _id: { $in: acceptedProjectIds } 
    }).sort({ createdAt: -1 });
    console.log("Member projects:", memberProjects.length);

    // Get projects where user is authorized personnel (by email or userId)
    const authorizedQuery: any[] = [];
    if (userEmail) {
      authorizedQuery.push({ "authorizedPersonnel.userEmail": userEmail });
    }
    authorizedQuery.push({ "authorizedPersonnel.userId": userId });

    const authorizedProjects = await Project.find({
      $or: authorizedQuery
    }).sort({ createdAt: -1 });
    console.log("Authorized projects:", authorizedProjects.length);

    // Combine and remove duplicates
    const allProjects = [...ownedProjects];
    memberProjects.forEach(memberProject => {
      if (!allProjects.some(p => p._id.toString() === memberProject._id.toString())) {
        allProjects.push(memberProject);
      }
    });
    
    // Add authorized projects
    authorizedProjects.forEach(authProject => {
      if (!allProjects.some(p => p._id.toString() === authProject._id.toString())) {
        allProjects.push(authProject);
      }
    });

    console.log("Total projects:", allProjects.length);

    return NextResponse.json(allProjects);
  } catch (error: any) {
    console.error("Error fetching my-projects:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
