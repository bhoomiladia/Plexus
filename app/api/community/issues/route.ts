import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Fetch all issues
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    const client = await clientPromise;
    const db = client.db();

    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ],
      };
    }

    const issues = await db
      .collection("issues")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({ issues }, { status: 200 });
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new issue
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { message: "Title and content are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const issue = {
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      title,
      content,
      tags: tags || [],
      responses: [],
      likes: 0,
      likedBy: [],
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("issues").insertOne(issue);

    return NextResponse.json(
      {
        message: "Issue created successfully",
        issue: { ...issue, _id: result.insertedId },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating issue:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
