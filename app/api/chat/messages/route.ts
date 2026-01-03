import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET: Fetch messages for a specific project
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(); // Use default database from connection string

    // Handle both string and ObjectId user IDs
    let userObjectId: ObjectId | null = null;
    try {
      if (ObjectId.isValid(session.user.id)) {
        userObjectId = new ObjectId(session.user.id);
      }
    } catch (e) {
      // Keep as null if conversion fails
    }

    // Verify user is a member of this project
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify user is owner or has an accepted application
    const isOwner = project.ownerId === session.user.id || 
                    (userObjectId && project.ownerId === userObjectId.toString());
    
    let hasAcceptedApplication = null;
    if (!isOwner) {
      hasAcceptedApplication = await db.collection("applications").findOne({
        projectId: new ObjectId(projectId),
        $or: [
          { userId: session.user.id },
          ...(userObjectId ? [{ userId: userObjectId.toString() }] : []),
        ],
        status: "ACCEPTED",
      });
    }

    if (!isOwner && !hasAcceptedApplication) {
      return NextResponse.json({ 
        error: "Access denied. Only project owner and accepted members can view this chat." 
      }, { status: 403 });
    }

    // Fetch messages
    const messages = await db
      .collection("messages")
      .find({ projectId: new ObjectId(projectId) })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json({ messages, project });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST: Send a new message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, content } = await req.json();

    if (!projectId || !content?.trim()) {
      return NextResponse.json({ error: "Project ID and content are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(); // Use default database from connection string

    // Handle both string and ObjectId user IDs
    let userObjectId: ObjectId | null = null;
    try {
      if (ObjectId.isValid(session.user.id)) {
        userObjectId = new ObjectId(session.user.id);
      }
    } catch (e) {
      // Keep as null if conversion fails
    }

    // Verify user is a member of this project
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isOwner = project.ownerId === session.user.id || 
                    (userObjectId && project.ownerId === userObjectId.toString());
    
    let hasAcceptedApplication = null;
    if (!isOwner) {
      hasAcceptedApplication = await db.collection("applications").findOne({
        projectId: new ObjectId(projectId),
        $or: [
          { userId: session.user.id },
          ...(userObjectId ? [{ userId: userObjectId.toString() }] : []),
        ],
        status: "ACCEPTED",
      });
    }

    if (!isOwner && !hasAcceptedApplication) {
      return NextResponse.json({ 
        error: "Access denied. Only project owner and accepted members can send messages." 
      }, { status: 403 });
    }

    // Create message
    const message = {
      projectId: new ObjectId(projectId),
      senderId: session.user.id,
      senderName: session.user.name || "Unknown",
      senderEmail: session.user.email || "",
      content: content.trim(),
      readBy: [session.user.id],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("messages").insertOne(message);

    return NextResponse.json({
      message: { ...message, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
