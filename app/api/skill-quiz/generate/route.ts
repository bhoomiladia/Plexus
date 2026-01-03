import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { skill } = await req.json();
    
    if (!skill || typeof skill !== "string") {
      return NextResponse.json({ message: "Skill is required" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { message: "AI service not configured" },
        { status: 503 }
      );
    }

    const prompt = `Generate exactly 5 multiple choice questions to verify basic knowledge of "${skill}". 
    
Requirements:
- Questions should be VERY EASY and test fundamental/beginner-level knowledge
- Focus on basic definitions, simple concepts, and common terminology
- Each question should have exactly 4 options (A, B, C, D)
- Only one option should be correct
- Make the correct answer obvious to anyone with basic familiarity
- Wrong options should be clearly incorrect
- All 5 questions should be easy difficulty

Return ONLY a valid JSON array with this exact structure, no markdown or extra text:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0
  }
]

The correctIndex should be 0-3 representing which option is correct.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to generate questions");
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || "";
    
    // Parse the JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse questions from AI response");
    }
    
    const questions = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!Array.isArray(questions) || questions.length !== 5) {
      throw new Error("Invalid questions format");
    }

    // Shuffle questions
    const shuffledQuestions = questions
      .map((q: { question: string; options: string[]; correctIndex: number }) => ({
        ...q,
        id: Math.random().toString(36).substring(7),
      }))
      .sort(() => Math.random() - 0.5);

    return NextResponse.json({ questions: shuffledQuestions, skill });
  } catch (error: any) {
    console.error("Error generating quiz:", error?.message || error);
    return NextResponse.json(
      { message: error?.message || "Failed to generate quiz questions" },
      { status: 500 }
    );
  }
}
