import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// POST - Add member to project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { userId, userName, userEmail, role } = body;

    if (!userId || !userName || !role) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const project = await db
      .collection("projects")
      .findOne({ _id: new ObjectId(id) });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      );
    }

    // Only owner can add members
    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Check if user is already a member
    const isMember = project.members?.some((m: any) => m.userId === userId);
    if (isMember) {
      return NextResponse.json(
        { message: "User is already a member" },
        { status: 400 }
      );
    }

    const newMember = {
      userId,
      userName,
      userEmail,
      role,
      joinedAt: new Date(),
    };

    await db.collection("projects").updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { members: newMember },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json(
      { message: "Member added successfully", member: newMember },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove member from project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const project = await db
      .collection("projects")
      .findOne({ _id: new ObjectId(id) });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      );
    }

    // Only owner can remove members (or user can remove themselves)
    if (project.ownerId !== session.user.id && userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Cannot remove owner
    if (userId === project.ownerId) {
      return NextResponse.json(
        { message: "Cannot remove project owner" },
        { status: 400 }
      );
    }

    await db.collection("projects").updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: { members: { userId } },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json(
      { message: "Member removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
