import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// POST - Add task to project
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
    const { title, description, assignedTo, priority, dueDate } = body;

    if (!title) {
      return NextResponse.json(
        { message: "Task title is required" },
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

    // Check if user is a member
    const isMember = project.members?.some(
      (m: any) => m.userId === session.user.id
    );
    if (!isMember) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const task = {
      id: new ObjectId().toString(),
      title,
      description: description || "",
      assignedTo: assignedTo || null,
      priority: priority || "medium",
      status: "todo",
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("projects").updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { tasks: task },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json(
      { message: "Task added successfully", task },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding task:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update task
export async function PATCH(
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
    const { taskId, ...updates } = body;

    if (!taskId) {
      return NextResponse.json(
        { message: "Task ID is required" },
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

    // Check if user is a member
    const isMember = project.members?.some(
      (m: any) => m.userId === session.user.id
    );
    if (!isMember) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Build update object
    const updateFields: any = {};
    if (updates.title) updateFields["tasks.$.title"] = updates.title;
    if (updates.description !== undefined)
      updateFields["tasks.$.description"] = updates.description;
    if (updates.assignedTo !== undefined)
      updateFields["tasks.$.assignedTo"] = updates.assignedTo;
    if (updates.priority) updateFields["tasks.$.priority"] = updates.priority;
    if (updates.status) updateFields["tasks.$.status"] = updates.status;
    if (updates.dueDate)
      updateFields["tasks.$.dueDate"] = new Date(updates.dueDate);
    updateFields["tasks.$.updatedAt"] = new Date();

    await db.collection("projects").updateOne(
      { _id: new ObjectId(id), "tasks.id": taskId },
      { $set: updateFields }
    );

    return NextResponse.json(
      { message: "Task updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove task
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
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { message: "Task ID is required" },
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

    // Only owner or task creator can delete
    const task = project.tasks?.find((t: any) => t.id === taskId);
    if (
      project.ownerId !== session.user.id &&
      task?.createdBy !== session.user.id
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await db.collection("projects").updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: { tasks: { id: taskId } },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
