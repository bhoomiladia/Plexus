import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Project from "@/models/Project";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const body = await req.json();

    // 2. Create the project
    // Ensure you match the session user ID to the ownerId
    const project = await Project.create({
      ...body,
      ownerId: session.user.id
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}