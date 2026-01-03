import { OpenAI } from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  try {
    const { messages, projectTitle, projectDesc, role } = await req.json();

    const systemPrompt = `
      PERSONA: You are a Senior System Architect at a top-tier firm. You are interviewing a candidate for the ${role} position for the project "${projectTitle}".
      
      BEHAVIORAL RULES:
      1. THE GATEKEEPER: The candidate has NOT built this project. They want to join it. Your job is to see if they are capable. 
      2. NO PROJECT SPOILERS: Do not explain the project idea. Focus on the skills needed to build it based on: "${projectDesc}".
      3. THE DRILL-DOWN: If a candidate mentions a technology (e.g., "I use Kafka"), ask a "Depth-3" question (e.g., "How do you handle rebalancing issues during a consumer group scale-up?").
      4. CHEATING DETECTION: 
         - If the text is robotic, perfectly structured, or academic, call it out: "That sounds like a GPT response. Explain it to me like we're at a whiteboard."
         - If [TAB_SWITCH_DETECTED] is in history, mention it ONCE: "I noticed you switched windows. Please keep this a real-time conversation."
      5. SPEECH STYLE: You are on a voice call. Use short sentences. No bullet points. No bold text. Use conversational filler like "Right," or "I see," but keep it professional.

      TERMINATION: 
      - After 6-10 sharp exchanges, provide a final verdict.
      - Append the exact string [END_INTERVIEW] to stop the session.
    `;

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
      temperature: 0.5,
    });

    const responseStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(new TextEncoder().encode(content));
        }
        controller.close();
      },
    });

    return new Response(responseStream);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}