import { projectArchitect } from "@/mastra/agents";
import { NextResponse } from "next/server";

// app/api/generate-roles/route.ts
export async function POST(req: Request) {
  try {
    const { title, description, userRole } = await req.json(); // Assume userRole comes from your frontend

    // Constructing a clearer prompt for the agent
    const prompt = `
      Project: ${title}
      Description: ${description}
      User's current role: ${userRole || "Not specified"} 
    `;

    const result = await projectArchitect.generate(prompt, {
      format: "aisdk"
    });

    const data = JSON.parse(result.text.replace(/```json|```/g, '').trim());
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}