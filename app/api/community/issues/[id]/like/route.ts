import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// POST - Toggle like on issue
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

    const client = await clientPromise;
    const db = client.db();

    const issue = await db
      .collection("issues")
      .findOne({ _id: new ObjectId(id) });

    if (!issue) {
      return NextResponse.json({ message: "Issue not found" }, { status: 404 });
    }

    const likedBy = issue.likedBy || [];
    const hasLiked = likedBy.includes(session.user.id);

    if (hasLiked) {
      // Unlike
      await db.collection("issues").updateOne(
        { _id: new ObjectId(id) },
        {
          $pull: { likedBy: session.user.id },
          $inc: { likes: -1 },
          $set: { updatedAt: new Date() },
        }
      );
      return NextResponse.json({ message: "Unliked", liked: false }, { status: 200 });
    } else {
      // Like
      await db.collection("issues").updateOne(
        { _id: new ObjectId(id) },
        {
          $addToSet: { likedBy: session.user.id },
          $inc: { likes: 1 },
          $set: { updatedAt: new Date() },
        }
      );
      return NextResponse.json({ message: "Liked", liked: true }, { status: 200 });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
