import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const userId = session.user.id;

    let userObjectId: ObjectId | null = null;
    try {
      if (ObjectId.isValid(userId)) {
        userObjectId = new ObjectId(userId);
      }
    } catch (e) {}

    const userQuery = userObjectId ? { _id: userObjectId } : { email: session.user.email };

    // Get user's skills
    const user = await db.collection("users").findOne(userQuery, {
      projection: { skills: 1, techStack: 1 },
    });

    const userSkills = user?.skills || user?.techStack || [];

    // Get all open projects to analyze skill demand
    const openProjects = await db.collection("projects")
      .find({ status: "OPEN" })
      .toArray();

    // Calculate skill demand across all projects
    const skillDemand: Record<string, number> = {};
    const skillMatches: Record<string, number> = {};

    openProjects.forEach((project: any) => {
      const roles = project.roles || [];
      roles.forEach((role: any) => {
        const allSkills = [...(role.mandatorySkills || []), ...(role.optionalSkills || [])];
        allSkills.forEach((skill: string) => {
          const normalizedSkill = skill.toLowerCase();
          skillDemand[normalizedSkill] = (skillDemand[normalizedSkill] || 0) + 1;
          
          // Check if user has this skill
          if (userSkills.some((us: string) => us.toLowerCase() === normalizedSkill)) {
            skillMatches[normalizedSkill] = (skillMatches[normalizedSkill] || 0) + 1;
          }
        });
      });
    });

    // Calculate user's skill coverage (what % of demanded skills does user have)
    const userSkillsLower = userSkills.map((s: string) => s.toLowerCase());
    const totalDemandedSkills = Object.keys(skillDemand).length;
    const userMatchedDemandedSkills = Object.keys(skillDemand).filter(
      (skill) => userSkillsLower.includes(skill)
    ).length;
    const coveragePercentage = totalDemandedSkills > 0 
      ? Math.round((userMatchedDemandedSkills / totalDemandedSkills) * 100) 
      : 0;

    // Get top demanded skills
    const topDemandedSkills = Object.entries(skillDemand)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({
        skill,
        demand: count,
        userHas: userSkillsLower.includes(skill),
      }));

    // Skill recommendations (high demand skills user doesn't have)
    const recommendedSkills = Object.entries(skillDemand)
      .filter(([skill]) => !userSkillsLower.includes(skill))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, demand: count }));

    // User's skill breakdown with project matches
    const userSkillBreakdown = userSkills.map((skill: string) => ({
      skill,
      projectMatches: skillDemand[skill.toLowerCase()] || 0,
    }));

    return NextResponse.json({
      userSkills,
      coveragePercentage,
      topDemandedSkills,
      recommendedSkills,
      userSkillBreakdown,
      totalOpenProjects: openProjects.length,
      matchingProjects: Object.values(skillMatches).reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    console.error("Error fetching skills analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills analytics" },
      { status: 500 }
    );
  }
}
