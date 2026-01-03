import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Fetch single issue
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const client = await clientPromise;
    const db = client.db();

    const issue = await db
      .collection("issues")
      .findOne({ _id: new ObjectId(id) });

    if (!issue) {
      return NextResponse.json({ message: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json({ issue }, { status: 200 });
  } catch (error) {
    console.error("Error fetching issue:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete issue
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

    const client = await clientPromise;
    const db = client.db();

    const issue = await db
      .collection("issues")
      .findOne({ _id: new ObjectId(id) });

    if (!issue) {
      return NextResponse.json({ message: "Issue not found" }, { status: 404 });
    }

    // Only allow deletion by the issue creator
    if (issue.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.collection("issues").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json(
      { message: "Issue deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting issue:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update issue status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (!["open", "resolved", "closed"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const { id } = await params;

    const client = await clientPromise;
    const db = client.db();

    const issue = await db
      .collection("issues")
      .findOne({ _id: new ObjectId(id) });

    if (!issue) {
      return NextResponse.json({ message: "Issue not found" }, { status: 404 });
    }

    // Only allow status update by the issue creator
    if (issue.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.collection("issues").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      { message: "Issue status updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
