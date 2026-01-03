import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Interview from "@/models/Interview";
import Application from "@/models/Application";
import Notification from "@/models/Notification";
import { ObjectId } from "mongodb";

// Get interview details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid interview ID" }, { status: 400 });
    }

    await dbConnect();

    const interview = await Interview.findById(id);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Only candidate or owner can view
    if (interview.candidateId !== session.user.id && interview.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    return NextResponse.json({
      interview: {
        _id: interview._id.toString(),
        projectId: interview.projectId.toString(),
        applicationId: interview.applicationId.toString(),
        roleId: interview.roleId,
        roleName: interview.roleName,
        candidateId: interview.candidateId,
        candidateName: interview.candidateName,
        candidateEmail: interview.candidateEmail,
        ownerId: interview.ownerId,
        ownerName: interview.ownerName,
        projectTitle: interview.projectTitle,
        projectDescription: interview.projectDescription,
        status: interview.status,
        result: interview.result,
        messages: interview.messages || [],
        startedAt: interview.startedAt,
        completedAt: interview.completedAt,
        aiVerdict: interview.aiVerdict,
      },
    });
  } catch (error) {
    console.error("Error fetching interview:", error);
    return NextResponse.json({ error: "Failed to fetch interview" }, { status: 500 });
  }
}

// Update interview (start, complete, save messages)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid interview ID" }, { status: 400 });
    }

    await dbConnect();

    const interview = await Interview.findById(id);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Only candidate can update during interview
    if (interview.candidateId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const updates: any = {};

    // Start interview
    if (body.action === "start") {
      if (interview.status !== "PENDING") {
        return NextResponse.json({ error: "Interview already started or completed" }, { status: 400 });
      }
      updates.status = "IN_PROGRESS";
      updates.startedAt = new Date();
    }

    // Save messages
    if (body.messages) {
      updates.messages = body.messages;
    }

    // Update tab switches
    if (body.tabSwitches !== undefined) {
      updates.tabSwitches = body.tabSwitches;
    }

    // Complete interview
    if (body.action === "complete") {
      updates.status = "COMPLETED";
      updates.completedAt = new Date();
      if (body.aiVerdict) {
        updates.aiVerdict = body.aiVerdict;
      }
      if (interview.startedAt) {
        updates.duration = Math.floor((Date.now() - new Date(interview.startedAt).getTime()) / 1000);
      }

      // Notify project owner
      await Notification.create({
        userId: interview.ownerId,
        type: "NEW_APPLICATION",
        title: "Interview Completed",
        message: `${interview.candidateName} has completed the interview for ${interview.roleName}. Review the results.`,
        link: `/dashboard/projects/manage/${interview.projectId}`,
        metadata: {
          projectId: interview.projectId,
          applicationId: interview.applicationId,
        },
      });
    }

    await Interview.findByIdAndUpdate(id, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating interview:", error);
    return NextResponse.json({ error: "Failed to update interview" }, { status: 500 });
  }
}

// Owner reviews and decides on interview
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { result, notes } = await req.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid interview ID" }, { status: 400 });
    }

    if (!["PASS", "FAIL"].includes(result)) {
      return NextResponse.json({ error: "Invalid result" }, { status: 400 });
    }

    await dbConnect();

    const interview = await Interview.findById(id);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Only owner can decide
    if (interview.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Update interview result
    await Interview.findByIdAndUpdate(id, {
      result,
      ownerNotes: notes,
    });

    // Update application status
    const newStatus = result === "PASS" ? "ACCEPTED" : "REJECTED";
    await Application.findByIdAndUpdate(interview.applicationId, {
      status: newStatus,
    });

    // Notify candidate
    await Notification.create({
      userId: interview.candidateId,
      type: result === "PASS" ? "APPLICATION_ACCEPTED" : "APPLICATION_REJECTED",
      title: result === "PASS" ? "Congratulations! You're Accepted!" : "Interview Result",
      message: result === "PASS"
        ? `You've been accepted for ${interview.roleName} in "${interview.projectTitle}"!`
        : `Unfortunately, you were not selected for ${interview.roleName} in "${interview.projectTitle}".`,
      link: `/dashboard/projects/${interview.projectId}`,
      metadata: {
        projectId: interview.projectId,
        applicationId: interview.applicationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deciding interview:", error);
    return NextResponse.json({ error: "Failed to process decision" }, { status: 500 });
  }
}
