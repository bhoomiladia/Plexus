import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Project from "@/models/Project";
import clientPromise from "@/lib/mongodb";

// POST: Add authorized personnel to a project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { projectId, userEmail } = await req.json();

    if (!projectId || !userEmail) {
      return NextResponse.json({ 
        message: "Missing required fields" 
      }, { status: 400 });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    // Verify ownership
    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ 
        message: "Forbidden: You don't own this project" 
      }, { status: 403 });
    }

    // Check if user is already authorized
    const alreadyAuthorized = project.authorizedPersonnel?.some(
      (p: any) => p.userEmail === userEmail
    );
    if (alreadyAuthorized) {
      return NextResponse.json({ 
        message: "This user is already authorized" 
      }, { status: 400 });
    }

    // Try to fetch user from database
    let userId = "pending"; // Will be updated when user logs in
    let userName = userEmail.split("@")[0];
    
    try {
      const client = await clientPromise;
      const db = client.db();
      const existingUser = await db.collection("users").findOne({
        email: userEmail,
      });

      if (existingUser) {
        userId = existingUser._id.toString();
        userName = existingUser.fullName || existingUser.name || userName;
      }
    } catch (dbError) {
      console.log("User not found in database, using email-based name");
    }

    // Add to authorized personnel using Mongoose
    project.authorizedPersonnel = project.authorizedPersonnel || [];
    project.authorizedPersonnel.push({
      userId,
      userName,
      userEmail,
      addedAt: new Date(),
    });
    await project.save();

    return NextResponse.json({ 
      message: "User authorized successfully",
      authorizedUser: { userId, userName, userEmail, addedAt: new Date() }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Authorize personnel error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE: Remove authorized personnel from a project
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const userEmail = searchParams.get("userEmail");

    if (!projectId || !userEmail) {
      return NextResponse.json({ 
        message: "Missing required fields" 
      }, { status: 400 });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    // Verify ownership
    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ 
        message: "Forbidden: You don't own this project" 
      }, { status: 403 });
    }

    // Remove from authorized personnel
    project.authorizedPersonnel = (project.authorizedPersonnel || []).filter(
      (p: any) => p.userEmail !== userEmail
    );
    await project.save();

    return NextResponse.json({ 
      message: "User authorization removed successfully"
    }, { status: 200 });

  } catch (error: any) {
    console.error("Remove authorized personnel error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
