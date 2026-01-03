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
    const db = client.db();

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Verify user is a member of this project
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check access: owner, authorized personnel, or accepted application
    const isOwner = project.ownerId === userId;
    
    const isAuthorized = project.authorizedPersonnel?.some(
      (p: any) => p.userEmail === userEmail || p.userId === userId
    );

    let hasAccess = isOwner || isAuthorized;
    
    if (!hasAccess) {
      // Check for accepted application (by userId or userEmail)
      const appQuery: any = {
        projectId: new ObjectId(projectId),
        status: "ACCEPTED",
      };
      if (userEmail) {
        appQuery.$or = [{ userId }, { userEmail }];
      } else {
        appQuery.userId = userId;
      }
      
      const acceptedApp = await db.collection("applications").findOne(appQuery);
      hasAccess = !!acceptedApp;
    }

    if (!hasAccess) {
      return NextResponse.json({ 
        error: "Access denied. Only project owner and accepted members can view this chat." 
      }, { status: 403 });
    }

    // Fetch messages - handle both ObjectId and string projectId
    const messages = await db
      .collection("messages")
      .find({ 
        $or: [
          { projectId: new ObjectId(projectId) },
          { projectId: projectId }
        ]
      })
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
    const db = client.db();

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Verify user is a member of this project
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check access: owner, authorized personnel, or accepted application
    const isOwner = project.ownerId === userId;
    
    const isAuthorized = project.authorizedPersonnel?.some(
      (p: any) => p.userEmail === userEmail || p.userId === userId
    );

    let hasAccess = isOwner || isAuthorized;
    
    if (!hasAccess) {
      // Check for accepted application (by userId or userEmail)
      const appQuery: any = {
        projectId: new ObjectId(projectId),
        status: "ACCEPTED",
      };
      if (userEmail) {
        appQuery.$or = [{ userId }, { userEmail }];
      } else {
        appQuery.userId = userId;
      }
      
      const acceptedApp = await db.collection("applications").findOne(appQuery);
      hasAccess = !!acceptedApp;
    }

    if (!hasAccess) {
      return NextResponse.json({ 
        error: "Access denied. Only project owner and accepted members can send messages." 
      }, { status: 403 });
    }

    // Create message - store projectId as ObjectId for consistency
    const message = {
      projectId: new ObjectId(projectId),
      senderId: userId,
      senderName: session.user.name || "Unknown",
      senderEmail: userEmail || "",
      content: content.trim(),
      readBy: [userId],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("messages").insertOne(message);

    return NextResponse.json({
      message: { 
        ...message, 
        _id: result.insertedId,
        projectId: projectId // Return as string for frontend
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
