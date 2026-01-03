import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Fetch tasks for a specific project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify user has access to this project
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const tasks = await db
      .collection("tasks")
      .find({ projectId: new ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .toArray();

    const formattedTasks = tasks.map((task: any) => ({
      _id: task._id.toString(),
      title: task.title,
      description: task.description || "",
      status: task.status || "pending",
      priority: task.priority || "medium",
      dueDate: task.dueDate,
      assignedTo: task.assignedTo || null,
      assignedToName: task.assignedToName || null,
      verifiedBy: task.verifiedBy || null,
      verifiedAt: task.verifiedAt || null,
      createdAt: task.createdAt,
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST - Create a new task for the project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, priority, dueDate, assignedTo, assignedToName } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify user is owner of the project
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only project owner can create tasks" }, { status: 403 });
    }

    const task = {
      userId: session.user.id,
      projectId: new ObjectId(projectId),
      title,
      description: description || "",
      status: "pending",
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedTo: assignedTo || null,
      assignedToName: assignedToName || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("tasks").insertOne(task);

    return NextResponse.json({
      success: true,
      task: { ...task, _id: result.insertedId.toString(), projectId: projectId },
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

// PATCH - Update a task
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, status, title, description, priority, dueDate, assignedTo, assignedToName, verifiedBy, verifiedAt } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get the project to check permissions
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isOwner = project.ownerId === session.user.id;
    
    // Get the task to check if user is assigned
    const task = await db.collection("tasks").findOne({
      _id: new ObjectId(taskId),
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isAssigned = task.assignedTo === session.user.email;
    
    // Check if user is authorized personnel
    const isAuthorized = project.authorizedPersonnel?.some(
      (p: any) => p.userEmail === session.user?.email
    );

    // Check if user is an accepted team member
    const applications = await db.collection("applications").find({
      projectId: new ObjectId(projectId),
      status: "ACCEPTED"
    }).toArray();
    
    const isTeamMember = applications.some(
      (app: any) => app.userEmail === session.user?.email || app.userId === session.user?.id
    );

    // Permission check: owner can do anything, assigned users can update their tasks
    if (!isOwner && !isAssigned && !isAuthorized && !isTeamMember) {
      return NextResponse.json({ error: "Not authorized to update this task" }, { status: 403 });
    }

    // Non-owners cannot verify tasks
    if (status === "verified" && !isOwner) {
      return NextResponse.json({ error: "Only project owner can verify tasks" }, { status: 403 });
    }

    const updateData: any = { updatedAt: new Date() };
    
    // Only owner can change these fields
    if (isOwner) {
      if (title) updateData.title = title;
      if (priority) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
      if (assignedToName !== undefined) updateData.assignedToName = assignedToName;
      if (verifiedBy) updateData.verifiedBy = verifiedBy;
      if (verifiedAt) updateData.verifiedAt = new Date(verifiedAt);
    }
    
    // Anyone with permission can update these
    if (status) updateData.status = status;
    if (description !== undefined) updateData.description = description;

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
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
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

    // Verify user is owner of the project
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only project owner can delete tasks" }, { status: 403 });
    }

    await db.collection("tasks").deleteOne({
      _id: new ObjectId(taskId),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
