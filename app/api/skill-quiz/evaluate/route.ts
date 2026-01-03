import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

type Answer = {
  questionId: string;
  selectedIndex: number;
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { questions, answers } = await req.json() as {
      questions: Question[];
      answers: Answer[];
    };

    if (!questions || !answers || !Array.isArray(questions) || !Array.isArray(answers)) {
      return NextResponse.json({ message: "Invalid request data" }, { status: 400 });
    }

    let correctCount = 0;
    const results = questions.map((q) => {
      const userAnswer = answers.find((a) => a.questionId === q.id);
      const isCorrect = userAnswer?.selectedIndex === q.correctIndex;
      if (isCorrect) correctCount++;
      
      return {
        questionId: q.id,
        question: q.question,
        userAnswer: userAnswer?.selectedIndex ?? -1,
        correctAnswer: q.correctIndex,
        isCorrect,
      };
    });

    const passed = correctCount >= 4;

    return NextResponse.json({
      passed,
      score: correctCount,
      total: questions.length,
      results,
    });
  } catch (error) {
    console.error("Error evaluating quiz:", error);
    return NextResponse.json(
      { message: "Failed to evaluate quiz" },
      { status: 500 }
    );
  }
}
