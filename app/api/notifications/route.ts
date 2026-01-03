import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Notification from "@/models/Notification";

// GET - Fetch all notifications for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const query: any = { userId: session.user.id };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      read: false,
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("GET notifications error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST - Create a new notification
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { userId, type, title, message, link, metadata } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      link,
      metadata,
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error: any) {
    console.error("POST notification error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PATCH - Mark all notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    await Notification.updateMany(
      { userId: session.user.id, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({ message: "All notifications marked as read" });
  } catch (error: any) {
    console.error("PATCH notifications error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
