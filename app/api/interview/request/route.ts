import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Interview from "@/models/Interview";
import Application from "@/models/Application";
import Project from "@/models/Project";
import Notification from "@/models/Notification";
import { ObjectId } from "mongodb";

// Create interview request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId, projectId, roleId } = await req.json();

    if (!applicationId || !projectId || !roleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    // Get project and verify ownership
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only project owner can request interviews" }, { status: 403 });
    }

    // Get application
    const application = await Application.findById(applicationId);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check if interview already exists
    const existingInterview = await Interview.findOne({
      applicationId: new ObjectId(applicationId),
      status: { $in: ["PENDING", "IN_PROGRESS"] },
    });

    if (existingInterview) {
      return NextResponse.json({ error: "Interview already requested" }, { status: 400 });
    }

    // Get role details
    const role = project.roles.find((r: any) => r._id.toString() === roleId);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Create interview
    const interview = await Interview.create({
      projectId: new ObjectId(projectId),
      applicationId: new ObjectId(applicationId),
      roleId,
      roleName: role.roleName,
      candidateId: application.userId,
      candidateName: application.userName,
      candidateEmail: application.userEmail,
      ownerId: session.user.id,
      ownerName: session.user.name || session.user.email,
      projectTitle: project.title,
      projectDescription: project.description,
      status: "PENDING",
    });

    // Send notification to candidate
    await Notification.create({
      userId: application.userId,
      type: "APPLICATION_SHORTLISTED",
      title: "Interview Request!",
      message: `You've been invited to interview for ${role.roleName} in "${project.title}". Click to start your AI interview.`,
      link: `/dashboard/interview/${interview._id}`,
      metadata: {
        projectId: new ObjectId(projectId),
        applicationId: new ObjectId(applicationId),
      },
    });

    return NextResponse.json({
      success: true,
      interview: {
        _id: interview._id.toString(),
        status: interview.status,
      },
    });
  } catch (error) {
    console.error("Error creating interview request:", error);
    return NextResponse.json({ error: "Failed to create interview request" }, { status: 500 });
  }
}

// Get interviews for current user (as candidate)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const interviews = await Interview.find({
      candidateId: session.user.id,
      status: { $in: ["PENDING", "IN_PROGRESS"] },
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      interviews: interviews.map((i) => ({
        _id: i._id.toString(),
        projectTitle: i.projectTitle,
        roleName: i.roleName,
        status: i.status,
        createdAt: i.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
  }
}
