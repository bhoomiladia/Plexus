import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Notification from "@/models/Notification";

// PATCH - Mark notification as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const notification = await Notification.findById(id);

    if (!notification) {
      return NextResponse.json(
        { message: "Notification not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    notification.read = true;
    await notification.save();

    return NextResponse.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error: any) {
    console.error("PATCH notification error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE - Delete notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const notification = await Notification.findById(id);

    if (!notification) {
      return NextResponse.json(
        { message: "Notification not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    await Notification.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Notification deleted",
    });
  } catch (error: any) {
    console.error("DELETE notification error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
