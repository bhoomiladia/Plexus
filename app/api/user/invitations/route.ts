import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Application from "@/models/Application";
import Project from "@/models/Project";

// GET - Fetch all pending invitations/applications for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Find all applications where user is shortlisted (invited by owner)
    const invitations = await Application.find({
      userEmail: session.user.email,
      status: "SHORTLISTED", // Shortlisted means invited/pending
    }).sort({ createdAt: -1 });

    // Enrich with project details
    const enrichedInvitations = await Promise.all(
      invitations.map(async (inv) => {
        const project = await Project.findById(inv.projectId);
        const role = project?.roles.id(inv.roleId);

        return {
          _id: inv._id.toString(),
          projectId: inv.projectId.toString(),
          roleId: inv.roleId,
          roleName: role?.roleName || "Team Member",
          userName: inv.userName,
          userEmail: inv.userEmail,
          status: inv.status,
          createdAt: inv.createdAt,
          projectDetails: project
            ? {
                title: project.title,
                description: project.description,
                ownerName: project.ownerName,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      invitations: enrichedInvitations,
      count: enrichedInvitations.length,
    });
  } catch (error: any) {
    console.error("GET invitations error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
