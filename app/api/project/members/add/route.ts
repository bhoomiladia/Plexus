import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Project from "@/models/Project";
import Application from "@/models/Application";
import { sendMemberAddedEmail } from "@/lib/email";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { projectId, roleId, userEmail } = await req.json();

    // Validate input
    if (!projectId || !roleId || !userEmail) {
      return NextResponse.json({ 
        message: "Missing required fields" 
      }, { status: 400 });
    }

    // Fetch the project
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

    // Check if role exists and has available slots
    const targetRole = project.roles.id(roleId);
    if (!targetRole) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    if (targetRole.filled >= targetRole.needed) {
      return NextResponse.json({ 
        message: "This role is already full" 
      }, { status: 400 });
    }

    // Check if user already has an accepted application for this project
    const existingApp = await Application.findOne({
      projectId,
      userEmail,
      status: "ACCEPTED"
    });

    if (existingApp) {
      return NextResponse.json({ 
        message: "This user is already a member of this project" 
      }, { status: 400 });
    }

    // Try to fetch user from database to get their real name
    let userName = userEmail.split("@")[0]; // Default: extract from email
    try {
      const client = await clientPromise;
      const db = client.db();
      const existingUser = await db.collection("users").findOne({
        email: userEmail,
      });

      if (existingUser && existingUser.fullName) {
        userName = existingUser.fullName;
      }
    } catch (dbError) {
      console.log("User not found in database, using email-based name");
    }

    // Create a new application with ACCEPTED status
    const newApplication = await Application.create({
      projectId,
      roleId,
      userId: "manual-add", // Special marker for manually added members
      userName,
      userEmail,
      status: "ACCEPTED",
      message: "Manually added by project owner",
    });

    // Increment the filled count
    await Project.updateOne(
      { _id: projectId, "roles._id": roleId },
      { $inc: { "roles.$.filled": 1 } }
    );

    // Check if all roles are now filled
    const updatedProject = await Project.findById(projectId);
    if (updatedProject) {
      const allRolesFilled = updatedProject.roles.every(
        (role: any) => role.filled >= role.needed
      );
      
      if (allRolesFilled) {
        await Project.updateOne(
          { _id: projectId },
          { status: "COMPLETED" }
        );
      }
    }

    // Send email notification to the added member
    try {
      await sendMemberAddedEmail({
        to: userEmail,
        projectTitle: project.title,
        roleName: targetRole.roleName,
        projectId: project._id.toString(),
        ownerName: session.user.name || "Project Owner",
      });
    } catch (emailError) {
      console.error("Failed to send member added email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      message: "Member added successfully",
      application: newApplication
    }, { status: 201 });

  } catch (error: any) {
    console.error("Add member error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
