import { Agent } from "@mastra/core/agent";
export const projectArchitect = new Agent({
  name: "Project Architect",
  instructions:
    "You are an expert Technical Project Manager. " +
    "Identify 2-4 key technical roles needed for the project. " +
    "IMPORTANT: If the user explicitly mentions their own role (e.g., 'I am the Lead Developer'), " +
    "do NOT include that role in the suggested roles list. Focus only on the additional help they need. " + // New rule
    "Return ONLY a JSON object: { \"roles\": [{ \"roleName\": string, \"needed\": number, \"mandatorySkills\": string[] }] }",
  model: "google/gemini-2.5-flash", 
  tools: {}, 
});