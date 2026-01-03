import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Fetch user's tasks
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const userId = session.user.id;

    let userObjectId: ObjectId | null = null;
    try {
      if (ObjectId.isValid(userId)) {
        userObjectId = new ObjectId(userId);
      }
    } catch (e) {}

    const userQuery = userObjectId
      ? { $or: [{ userId: userId }, { userId: userObjectId }, { assignedTo: userId }, { assignedTo: userObjectId }] }
      : { $or: [{ userId: userId }, { assignedTo: userId }] };

    const tasks = await db.collection("tasks")
      .find(userQuery)
      .sort({ dueDate: 1, priority: -1 })
      .limit(20)
      .toArray();

    // Get project details for tasks
    const projectIds = [...new Set(tasks.map((t: any) => t.projectId).filter(Boolean))];
    const projects = await db.collection("projects")
      .find({ _id: { $in: projectIds.map((id: any) => {
        try { return new ObjectId(id); } catch { return id; }
      })}})
      .toArray();

    const projectMap = new Map(projects.map((p: any) => [p._id.toString(), p.title]));

    const formattedTasks = tasks.map((task: any) => ({
      _id: task._id.toString(),
      title: task.title,
      description: task.description,
      status: task.status || "pending",
      priority: task.priority || "medium",
      dueDate: task.dueDate,
      projectId: task.projectId?.toString(),
      projectTitle: task.projectId ? projectMap.get(task.projectId.toString()) : null,
      createdAt: task.createdAt,
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST - Create a new task
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, dueDate, priority, projectId } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const task = {
      userId: session.user.id,
      title,
      description: description || "",
      status: "pending",
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId: projectId ? new ObjectId(projectId) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("tasks").insertOne(task);

    return NextResponse.json({
      success: true,
      task: { ...task, _id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

// PATCH - Update task status
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, status, title, description, dueDate, priority } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (priority) updateData.priority = priority;

    await db.collection("tasks").updateOne(
      { _id: new ObjectId(taskId) },
      { $set: updateData }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE - Delete a task
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection("tasks").deleteOne({
      _id: new ObjectId(taskId),
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
