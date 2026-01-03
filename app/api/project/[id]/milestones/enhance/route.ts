import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// POST - Get AI suggestions to enhance a milestone
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
    const { milestoneId, milestoneTitle, milestoneDescription, enhanceType } = body;

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
      return NextResponse.json({ error: "Only project owner can enhance milestones" }, { status: 403 });
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (enhanceType) {
      case "tasks":
        systemPrompt = `You are a project management expert. Generate detailed, actionable tasks for a milestone.
Return a JSON array of 5-8 task objects with: { title: string, description: string, priority: "low"|"medium"|"high", estimatedHours: number }
Only return valid JSON, no markdown.`;
        userPrompt = `Generate tasks for this milestone:
Title: ${milestoneTitle}
Description: ${milestoneDescription}
Project: ${project.title}`;
        break;

      case "risks":
        systemPrompt = `You are a risk management expert. Identify potential risks and mitigation strategies.
Return a JSON array of 3-5 risk objects with: { risk: string, impact: "low"|"medium"|"high", probability: "low"|"medium"|"high", mitigation: string }
Only return valid JSON, no markdown.`;
        userPrompt = `Identify risks for this milestone:
Title: ${milestoneTitle}
Description: ${milestoneDescription}
Project: ${project.title}`;
        break;

      case "dependencies":
        systemPrompt = `You are a project planning expert. Identify dependencies and prerequisites.
Return a JSON object with: { prerequisites: string[], blockers: string[], resources: string[] }
Only return valid JSON, no markdown.`;
        userPrompt = `Identify dependencies for this milestone:
Title: ${milestoneTitle}
Description: ${milestoneDescription}
Project: ${project.title}`;
        break;

      case "timeline":
        systemPrompt = `You are a project scheduling expert. Break down the milestone into phases with time estimates.
Return a JSON array of 3-5 phase objects with: { phase: string, description: string, durationDays: number, order: number }
Only return valid JSON, no markdown.`;
        userPrompt = `Create a timeline breakdown for this milestone:
Title: ${milestoneTitle}
Description: ${milestoneDescription}
Project: ${project.title}`;
        break;

      default:
        return NextResponse.json({ error: "Invalid enhance type" }, { status: 400 });
    }

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Groq API error:", error);
      return NextResponse.json({ error: "Failed to enhance milestone" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    let result;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Optionally update the milestone with the new data
    if (milestoneId && enhanceType === "tasks") {
      await db.collection("milestones").updateOne(
        { _id: new ObjectId(milestoneId) },
        { 
          $set: { 
            suggestedTasks: result.map((t: any) => t.title),
            updatedAt: new Date() 
          } 
        }
      );
    }

    return NextResponse.json({ 
      success: true, 
      enhanceType,
      data: result 
    });
  } catch (error) {
    console.error("Error enhancing milestone:", error);
    return NextResponse.json({ error: "Failed to enhance milestone" }, { status: 500 });
  }
}
