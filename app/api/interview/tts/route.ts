import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Use browser's built-in speech synthesis on client side
    // This endpoint can be extended to use ElevenLabs or other TTS services
    // For now, we'll return the text and let the client handle TTS
    
    return NextResponse.json({ 
      text,
      useClientTTS: true,
    });
  } catch (error) {
    console.error("Error in TTS:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
