import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";

// POST - Generate AI response for issue
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

    const client = await clientPromise;
    const db = client.db();

    const issue = await db
      .collection("issues")
      .findOne({ _id: new ObjectId(id) });

    if (!issue) {
      return NextResponse.json({ message: "Issue not found" }, { status: 404 });
    }

    // Check if AI has already responded
    const hasAIResponse = issue.responses?.some((r: any) => r.isAI);
    if (hasAIResponse) {
      return NextResponse.json(
        { message: "AI has already responded to this issue" },
        { status: 400 }
      );
    }

    // Generate AI response using Gemini
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { message: "AI service not configured" },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a helpful technical assistant in a developer community. A user has posted the following issue:

Title: ${issue.title}
Content: ${issue.content}
Tags: ${issue.tags?.join(", ") || "None"}

Provide a helpful, concise, and technical response to help solve their problem. Be specific and actionable. Keep your response under 200 words.`;

    const result = await model.generateContent(prompt);
    const aiText = result.response.text();

    const aiResponse = {
      id: new ObjectId().toString(),
      userId: "ai",
      author: "Gemini AI Assistant",
      text: aiText,
      isAI: true,
      createdAt: new Date(),
    };

    await db.collection("issues").updateOne({ _id: new ObjectId(id) }, {
      $push: { responses: aiResponse },
      $set: { updatedAt: new Date() },
    } as any);

    return NextResponse.json(
      {
        message: "AI response generated successfully",
        response: aiResponse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating AI response:", error);
    return NextResponse.json(
      { message: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
