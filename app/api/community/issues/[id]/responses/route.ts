import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// POST - Add response to issue
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { message: "Response text is required" },
        { status: 400 }
      );
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

    const response = {
      id: new ObjectId().toString(),
      userId: session.user.id,
      author: session.user.name,
      text,
      isAI: false,
      createdAt: new Date(),
    };

    await db.collection("issues").updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { responses: response },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json(
      {
        message: "Response added successfully",
        response,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding response:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
