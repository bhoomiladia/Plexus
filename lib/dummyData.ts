// lib/dummyData.ts

// Since you aren't using @/types, we define the local interfaces here
export interface Role {
    id: string;
    roleName: string;
    mandatorySkills: string[];
    optionalSkills: string[];
    needed: number;
    filled: number;
  }
  
  export interface Project {
    id: string;
    ownerId: string;
    title: string;
    description: string;
    status: 'OPEN' | 'COMPLETED';
    roles: Role[];
    links?: {
      github?: string;
      demo?: string;
    };
  }
  
  export interface Application {
    id: string;
    projectId: string;
    userId: string;
    roleId: string;
    status: 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';
    appliedDate: string;
  }
  
  export const mockProjects: Project[] = [
    {
      id: "p1",
      ownerId: "695582476e966e145e1764aa",
      title: "AI CRM System",
      description: "A high-scale CRM using Gemini API to automate leads.",
      status: "OPEN",
      roles: [
        {
          id: "r1",
          roleName: "Frontend Developer",
          mandatorySkills: ["React", "Next.js"],
          optionalSkills: ["Tailwind"],
          needed: 2,
          filled: 0,
        }
      ],
    },
    {
      id: "p2",
      ownerId: "abc",
      title: "AI CRM System",
      description: "A high-scale CRM using Gemini API to automate leads.",
      status: "OPEN",
      roles: [
        {
          id: "r2",
          roleName: "Frontend Developer",
          mandatorySkills: ["React", "Next.js"],
          optionalSkills: ["Tailwind"],
          needed: 2,
          filled: 0,
        }
      ],
    },
    {
      id: "p3",
      ownerId: "abc",
      title: "ok System",
      description: "A high-scale CRM using Gemini API to automate leads.",
      status: "COMPLETED",
      roles: [
      ],
    }
  ];
  
  export const mockApplications: Application[] = [
    {
      id: "a1",
      projectId: "p1",
      userId: "u1",
      roleId: "r1",
      status: "PENDING",
      appliedDate: "2026-01-01",
    }
  ];