import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Application from "@/models/Application";
import Project from "@/models/Project";
import { sendAcceptanceEmail } from "@/lib/email";
import { 
  notifyApplicationAccepted, 
  notifyApplicationRejected,
  notifyMemberRemoved 
} from "@/lib/notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // 4. Get request body
    const { status, roleId, projectId } = await req.json();

    // 5. Verify the current user owns the project they are managing
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden: Not your project" }, { status: 403 });
    }

    // 6. Check if seats are still available before accepting
    if (status === "ACCEPTED") {
      const targetRole = project.roles.id(roleId); // Mongoose helper to find subdoc by ID
      if (targetRole && targetRole.filled >= targetRole.needed) {
        return NextResponse.json({ message: "All seats for this role are already filled" }, { status: 400 });
      }
    }

    // 7. Update Application Status
    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedApplication) {
      return NextResponse.json({ message: "Application not found" }, { status: 404 });
    }

    // 8. If accepted, increment the "filled" count in the Project's roles array
    if (status === "ACCEPTED") {
      await Project.updateOne(
        { _id: projectId, "roles._id": roleId },
        { $inc: { "roles.$.filled": 1 } }
      );

      // Check if all roles are now filled and auto-close the project
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
          console.log(`Project ${projectId} auto-closed: all roles filled`);
        }
      }

      // 9. Send acceptance email to the applicant
      const targetRole = project.roles.id(roleId);
      if (targetRole && updatedApplication.userEmail) {
        try {
          await sendAcceptanceEmail({
            to: updatedApplication.userEmail,
            userName: updatedApplication.userName,
            projectTitle: project.title,
            roleName: targetRole.roleName,
            projectId: project._id.toString(),
          });

          // Send notification
          await notifyApplicationAccepted(
            updatedApplication.userId,
            project.title,
            targetRole.roleName,
            project._id.toString(),
            updatedApplication._id.toString()
          );
        } catch (emailError) {
          console.error("Failed to send acceptance email:", emailError);
          // Don't fail the request if email fails
        }
      }
    }

    // Handle rejection notification
    if (status === "REJECTED") {
      const targetRole = project.roles.id(roleId);
      if (targetRole) {
        await notifyApplicationRejected(
          updatedApplication.userId,
          project.title,
          targetRole.roleName,
          project._id.toString(),
          updatedApplication._id.toString()
        );
      }
    }

    // 10. If removed, decrement the "filled" count
    if (status === "REMOVED") {
      const targetRole = project.roles.id(roleId);
      if (targetRole && targetRole.filled > 0) {
        await Project.updateOne(
          { _id: projectId, "roles._id": roleId },
          { $inc: { "roles.$.filled": -1 } }
        );

        // If project was completed, reopen it since a slot is now available
        if (project.status === "COMPLETED") {
          await Project.updateOne(
            { _id: projectId },
            { status: "OPEN" }
          );
          console.log(`Project ${projectId} reopened: member removed`);
        }

        // Send notification
        await notifyMemberRemoved(
          updatedApplication.userId,
          project.title,
          project._id.toString()
        );
      }
    }

    return NextResponse.json({ 
      message: `Applicant ${status.toLowerCase()} successfully`, 
      application: updatedApplication 
    }, { status: 200 });

  } catch (error: any) {
    console.error("PATCH Application Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}