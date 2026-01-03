import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Application from "@/models/Application";
import Notification from "@/models/Notification";
import Project from "@/models/Project";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId, action } = await req.json();

    if (!applicationId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await dbConnect();

    // Find the application
    const application = await Application.findById(applicationId);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Verify the current user is the one being shortlisted
    if (application.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to respond to this application" }, { status: 403 });
    }

    // Verify the application is in SHORTLISTED status
    if (application.status !== "SHORTLISTED") {
      return NextResponse.json({ error: "Can only respond to shortlisted applications" }, { status: 400 });
    }

    // Get project details for notification
    const project = await Project.findById(application.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get role name
    const role = project.roles.find((r: any) => r._id.toString() === application.roleId);
    const roleName = role?.roleName || "a role";

    if (action === "accept") {
      // Update application status to PENDING (moves to Inbound Requests)
      application.status = "PENDING";
      application.message = "User accepted the shortlist invitation";
      await application.save();

      // Notify project owner
      await Notification.create({
        userId: project.ownerId,
        type: "NEW_APPLICATION",
        title: "Shortlist Accepted!",
        message: `${session.user.name || session.user.email} accepted your shortlist for ${roleName} in "${project.title}"`,
        link: `/dashboard/projects/manage/${project._id}`,
        metadata: {
          projectId: project._id,
          applicationId: application._id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "You have accepted the opportunity",
        status: "PENDING",
      });
    } else {
      // Decline - remove the application
      await Application.findByIdAndDelete(applicationId);

      // Notify project owner
      await Notification.create({
        userId: project.ownerId,
        type: "APPLICATION_REJECTED",
        title: "Shortlist Declined",
        message: `${session.user.name || session.user.email} declined your shortlist for ${roleName} in "${project.title}"`,
        link: `/dashboard/projects/manage/${project._id}`,
        metadata: {
          projectId: project._id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "You have declined the opportunity",
        status: "DECLINED",
      });
    }
  } catch (error) {
    console.error("Error responding to application:", error);
    return NextResponse.json({ error: "Failed to respond to application" }, { status: 500 });
  }
}
