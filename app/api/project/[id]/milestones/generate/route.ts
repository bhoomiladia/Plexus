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
    const { projectTitle, projectDescription, existingTasks, teamSize, duration } = body;

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
      return NextResponse.json({ error: "Only project owner can generate milestones" }, { status: 403 });
    }

    const systemPrompt = `You are a project management expert. Generate realistic and actionable project milestones based on the project details provided.

For each milestone, provide:
- title: A clear, concise milestone name
- description: Detailed description of what needs to be achieved
- targetDate: Suggested target date (as ISO string, starting from today)
- priority: "low", "medium", or "high"
- suggestedTasks: Array of 2-4 task suggestions to achieve this milestone
- dependencies: Array of milestone indices this depends on (0-indexed)
- deliverables: Array of expected deliverables/outputs

Return a JSON array of 4-6 milestones that progressively build towards project completion.
Only return valid JSON, no markdown or explanations.`;

    const userPrompt = `Generate milestones for this project:

Project Title: ${projectTitle}
Project Description: ${projectDescription}
Team Size: ${teamSize || "Unknown"}
Expected Duration: ${duration || "3 months"}
${existingTasks?.length > 0 ? `\nExisting Tasks:\n${existingTasks.map((t: any) => `- ${t.title} (${t.status})`).join("\n")}` : ""}

Generate milestones that are:
1. Realistic and achievable
2. Progressive (each builds on previous)
3. Measurable with clear deliverables
4. Time-bound with reasonable deadlines`;

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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Groq API error:", error);
      return NextResponse.json({ error: "Failed to generate milestones" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Parse the JSON response
    let milestones;
    try {
      // Clean up the response in case it has markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      milestones = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ milestones });
  } catch (error) {
    console.error("Error generating milestones:", error);
    return NextResponse.json({ error: "Failed to generate milestones" }, { status: 500 });
  }
}
