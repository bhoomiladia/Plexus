import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    // Delete user's projects
    await db.collection("projects").deleteMany({ ownerId: userId });

    // Remove user from project members
    await db.collection("projects").updateMany(
      { "members.userId": userId },
      { $pull: { members: { userId } } }
    );

    // Delete user's applications
    await db.collection("applications").deleteMany({ userId });

    // Delete user's notifications
    await db.collection("notifications").deleteMany({ userId });

    // Delete user's messages
    await db.collection("messages").deleteMany({ senderId: userId });

    // Delete user's issues
    await db.collection("issues").deleteMany({ userId });

    // Finally, delete the user account
    await db.collection("users").deleteOne({ _id: userId });

    return NextResponse.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ message: "Failed to delete account" }, { status: 500 });
  }
}
