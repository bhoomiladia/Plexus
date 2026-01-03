import { Agent } from '@mastra/core';
import { z } from 'zod';

const RoadmapSchema = z.object({
  milestones: z.array(z.object({
    title: z.string(),
    duration: z.string(),
    tasks: z.array(z.string()),
    focus: z.string(),
  })),
});

export const mastroAgent = new Agent({
  name: 'Mastro-Architect',
  instructions: `
    You are a technical project manager. Your goal is to generate a brutalist, 
    highly efficient roadmap for a specific role within a project.
    
    RULES:
    1. Break the total timeline into 4 distinct phases.
    2. Each task must be actionable and technical (e.g., "Implement JWT auth" not "Do login").
    3. Use the additional notes provided by the user to pivot the technical focus.
  `,
  model: {
    provider: 'GROQ',
    name: 'llama-3.3-70b-versatile',
  },
  outputs: {
    roadmap: RoadmapSchema,
  },
});