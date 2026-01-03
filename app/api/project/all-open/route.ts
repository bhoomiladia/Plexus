import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Project from "@/models/Project";

export async function GET() {
  await dbConnect();
  
  // Fetch all open projects
  const projects = await Project.find({ status: "OPEN" }).sort({ createdAt: -1 });
  
  // Filter out projects where all roles are filled
  const availableProjects = projects.filter(project => {
    // Check if at least one role has available slots
    return project.roles.some((role: any) => role.filled < role.needed);
  });
  
  return NextResponse.json(availableProjects);
}