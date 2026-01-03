import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { message, context } = body;

    const client = await clientPromise;
    const db = client.db();

    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get existing milestones for context
    const milestones = await db
      .collection("milestones")
      .find({ projectId: new ObjectId(projectId) })
      .toArray();

    const systemPrompt = `You are an expert project manager and planning assistant. Help the user plan and manage their project milestones.

Project Context:
- Title: ${project.title}
- Description: ${project.description}
- Current Milestones: ${milestones.length > 0 ? milestones.map((m: any) => `${m.title} (${m.status})`).join(", ") : "None yet"}

You can help with:
1. Suggesting new milestones
2. Breaking down milestones into tasks
3. Estimating timelines
4. Identifying risks and dependencies
5. Prioritizing work
6. Providing best practices

Be concise, actionable, and specific to their project. If suggesting milestones or tasks, format them clearly.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...(context || []),
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Groq API error:", error);
      return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: content 
    });
  } catch (error) {
    console.error("Error in milestone chat:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
