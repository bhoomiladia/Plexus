import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Project from "@/models/Project";

export async function GET() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
  
  // Fetch all open projects
  const projects = await Project.find({ status: "OPEN" }).sort({ createdAt: -1 });
  
  // Filter out projects where all roles are filled
  const availableProjects = projects.filter(project => {
    // Check if at least one role has available slots
    return project.roles.some((role: any) => role.filled < role.needed);
  });
  
  return NextResponse.json(availableProjects);
}