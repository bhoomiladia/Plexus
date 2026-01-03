import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Fetch all projects or user's projects
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter"); // "my" | "open" | "all"
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // "OPEN" | "IN_PROGRESS" | "COMPLETED"

    const client = await clientPromise;
    const db = client.db();

    let query: any = {};

    // Filter by user's projects
    if (filter === "my") {
      query = {
        $or: [
          { ownerId: session.user.id },
          { "members.userId": session.user.id },
        ],
      };
    } else if (filter === "open") {
      query = { status: "OPEN" };
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const projects = await db
      .collection("projects")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    console.log("Query:", JSON.stringify(query));
    console.log("Found projects:", projects.length);
    console.log("Session user ID:", session.user.id);

    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, tags, roles, deadline } = body;

    if (!title || !description) {
      return NextResponse.json(
        { message: "Title and description are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const project = {
      ownerId: session.user.id,
      ownerName: session.user.name,
      ownerEmail: session.user.email,
      title,
      description,
      tags: tags || [],
      roles: roles || [],
      deadline: deadline ? new Date(deadline) : null,
      status: "OPEN",
      members: [
        {
          userId: session.user.id,
          userName: session.user.name,
          userEmail: session.user.email,
          role: "Owner",
          joinedAt: new Date(),
        },
      ],
      applications: [],
      tasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("projects").insertOne(project);

    console.log("Project created:", result.insertedId);
    console.log("Project data:", project);

    return NextResponse.json(
      {
        message: "Project created successfully",
        project: { ...project, _id: result.insertedId },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
