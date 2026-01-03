import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";
import Project from "@/models/Project";
import Application from "@/models/Application";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }

  // Get projects owned by the user
  const ownedProjects = await Project.find({ ownerId: session.user.id }).sort({ createdAt: -1 });

  // Get projects where user has been accepted as a member
  const acceptedApplications = await Application.find({ 
    userId: session.user.id, 
    status: "ACCEPTED" 
  }).select("projectId");

  const acceptedProjectIds = acceptedApplications.map(app => app.projectId);
  const memberProjects = await Project.find({ 
    _id: { $in: acceptedProjectIds } 
  }).sort({ createdAt: -1 });

  // Combine and remove duplicates (in case user owns a project they're also a member of)
  const allProjects = [...ownedProjects];
  memberProjects.forEach(memberProject => {
    if (!allProjects.some(p => p._id.toString() === memberProject._id.toString())) {
      allProjects.push(memberProject);
    }
  });

  return NextResponse.json(allProjects);
}