import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Fetch milestones for a project
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

    const milestones = await db
      .collection("milestones")
      .find({ projectId: new ObjectId(projectId) })
      .sort({ order: 1, createdAt: 1 })
      .toArray();

    const formattedMilestones = milestones.map((m: any) => ({
      _id: m._id.toString(),
      title: m.title,
      description: m.description,
      status: m.status || "pending",
      priority: m.priority || "medium",
      targetDate: m.targetDate,
      completedDate: m.completedDate,
      suggestedTasks: m.suggestedTasks || [],
      deliverables: m.deliverables || [],
      dependencies: m.dependencies || [],
      progress: m.progress || 0,
      order: m.order || 0,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ milestones: formattedMilestones });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
  }
}

// POST - Create milestone(s)
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
    const { milestones: milestonesData, milestone: singleMilestone } = body;

    const client = await clientPromise;
    const db = client.db();

    // Verify user is owner
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only project owner can create milestones" }, { status: 403 });
    }

    // Get current max order
    const lastMilestone = await db
      .collection("milestones")
      .findOne({ projectId: new ObjectId(projectId) }, { sort: { order: -1 } });
    
    let currentOrder = lastMilestone?.order || 0;

    // Handle bulk creation (from AI generation)
    if (milestonesData && Array.isArray(milestonesData)) {
      const milestonesToInsert = milestonesData.map((m: any, index: number) => ({
        projectId: new ObjectId(projectId),
        title: m.title,
        description: m.description || "",
        status: "pending",
        priority: m.priority || "medium",
        targetDate: m.targetDate ? new Date(m.targetDate) : null,
        suggestedTasks: m.suggestedTasks || [],
        deliverables: m.deliverables || [],
        dependencies: m.dependencies || [],
        progress: 0,
        order: currentOrder + index + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await db.collection("milestones").insertMany(milestonesToInsert);
      
      const insertedMilestones = milestonesToInsert.map((m: any, index: number) => ({
        ...m,
        _id: result.insertedIds[index].toString(),
        projectId: projectId,
      }));

      return NextResponse.json({ success: true, milestones: insertedMilestones });
    }

    // Handle single milestone creation
    if (singleMilestone) {
      const newMilestone = {
        projectId: new ObjectId(projectId),
        title: singleMilestone.title,
        description: singleMilestone.description || "",
        status: "pending",
        priority: singleMilestone.priority || "medium",
        targetDate: singleMilestone.targetDate ? new Date(singleMilestone.targetDate) : null,
        suggestedTasks: singleMilestone.suggestedTasks || [],
        deliverables: singleMilestone.deliverables || [],
        dependencies: [],
        progress: 0,
        order: currentOrder + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("milestones").insertOne(newMilestone);

      return NextResponse.json({
        success: true,
        milestone: { ...newMilestone, _id: result.insertedId.toString(), projectId },
      });
    }

    return NextResponse.json({ error: "No milestone data provided" }, { status: 400 });
  } catch (error) {
    console.error("Error creating milestone:", error);
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
  }
}

// PATCH - Update a milestone
export async function PATCH(
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
    const { milestoneId, ...updateData } = body;

    if (!milestoneId) {
      return NextResponse.json({ error: "Milestone ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify user is owner
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only project owner can update milestones" }, { status: 403 });
    }

    const updates: any = { updatedAt: new Date() };
    
    if (updateData.title) updates.title = updateData.title;
    if (updateData.description !== undefined) updates.description = updateData.description;
    if (updateData.status) {
      updates.status = updateData.status;
      if (updateData.status === "completed") {
        updates.completedDate = new Date();
        updates.progress = 100;
      }
    }
    if (updateData.priority) updates.priority = updateData.priority;
    if (updateData.targetDate !== undefined) {
      updates.targetDate = updateData.targetDate ? new Date(updateData.targetDate) : null;
    }
    if (updateData.progress !== undefined) updates.progress = updateData.progress;

    await db.collection("milestones").updateOne(
      { _id: new ObjectId(milestoneId) },
      { $set: updates }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
  }
}

// DELETE - Delete a milestone
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
    const milestoneId = searchParams.get("milestoneId");

    if (!milestoneId) {
      return NextResponse.json({ error: "Milestone ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify user is owner
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only project owner can delete milestones" }, { status: 403 });
    }

    await db.collection("milestones").deleteOne({
      _id: new ObjectId(milestoneId),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });
  }
}
