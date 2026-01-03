import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Project from "@/models/Project";
import Application from "@/models/Application";
import Notification from "@/models/Notification";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, roleId, userId, userName, userEmail } = await req.json();

    if (!projectId || !roleId || !userId || !userName || !userEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    // Verify the current user is the project owner
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only project owner can shortlist" }, { status: 403 });
    }

    // Check if user is already shortlisted/applied for this role
    const existingApplication = await Application.findOne({
      projectId: new ObjectId(projectId),
      roleId,
      userId,
    });

    if (existingApplication) {
      return NextResponse.json({ 
        error: "User already has an application for this role" 
      }, { status: 400 });
    }

    // Create application with SHORTLISTED status
    const application = await Application.create({
      projectId: new ObjectId(projectId),
      roleId,
      userId,
      userName,
      userEmail,
      status: "SHORTLISTED",
      message: "Shortlisted by project owner based on skill match",
    });

    // Get role name for notification
    const role = project.roles.find((r: any) => r._id.toString() === roleId);
    const roleName = role?.roleName || "a role";

    // Create notification for the shortlisted user
    await Notification.create({
      userId,
      type: "APPLICATION_SHORTLISTED",
      title: "You've been shortlisted!",
      message: `You've been shortlisted for ${roleName} in "${project.title}"`,
      link: `/dashboard/projects/${projectId}`,
      metadata: {
        projectId: new ObjectId(projectId),
        applicationId: application._id,
      },
    });

    return NextResponse.json({
      success: true,
      application: {
        _id: application._id.toString(),
        projectId: application.projectId.toString(),
        roleId: application.roleId,
        userId: application.userId,
        userName: application.userName,
        userEmail: application.userEmail,
        status: application.status,
      },
    });
  } catch (error) {
    console.error("Error shortlisting user:", error);
    return NextResponse.json({ error: "Failed to shortlist user" }, { status: 500 });
  }
}
