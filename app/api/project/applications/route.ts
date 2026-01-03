import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Application from "@/models/Application";
import Project from "@/models/Project";
import { notifyNewApplication } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { projectId, roleId } = await req.json();

    if (!projectId || !roleId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Check for duplicate application
    const existingApp = await Application.findOne({
      projectId,
      userId: session.user.id,
      roleId
    });

    if (existingApp) {
      return NextResponse.json(
        { message: "You have already applied for this role" }, 
        { status: 400 }
      );
    }

    // FIX: Include userName and userEmail from the session
    const newApplication = await Application.create({
      projectId,
      roleId,
      userId: session.user.id,
      userName: session.user.name,   // Added this
      userEmail: session.user.email, // Added this
      status: "PENDING",
      appliedAt: new Date()
    });

    // Fetch project details to notify owner
    const project = await Project.findById(projectId);
    if (project) {
      const role = project.roles.find((r: any) => r._id.toString() === roleId);
      await notifyNewApplication(
        project.ownerId,
        session.user.name || "A user",
        project.title,
        role?.roleName || "a role",
        projectId,
        newApplication._id.toString()
      );
    }

    return NextResponse.json(
      { message: "Application submitted!", application: newApplication }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error("POST Application Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}