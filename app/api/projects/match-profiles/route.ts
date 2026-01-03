import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface Role {
  roleName: string;
  mandatorySkills: string[];
  optionalSkills?: string[];
  needed: number;
}

interface MatchedProfile {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  skills: string[];
  matchedRole: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roles } = await req.json();

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json({ error: "Roles are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const currentUserId = session.user.id;

    // Get all users except the current user
    const users = await db.collection("users").find(
      { _id: { $ne: new ObjectId(currentUserId) } },
      {
        projection: {
          _id: 1,
          name: 1,
          fullName: 1,
          email: 1,
          avatar: 1,
          skills: 1,
          techStack: 1,
        },
      }
    ).toArray();

    const matchedProfiles: MatchedProfile[] = [];

    // For each role, find matching users
    for (const role of roles as Role[]) {
      const mandatorySkills = role.mandatorySkills || [];
      const optionalSkills = role.optionalSkills || [];
      const allRequiredSkills = [...mandatorySkills];

      for (const user of users) {
        const userSkills = (user.skills || user.techStack || []).map((s: string) => s.toLowerCase());
        
        if (userSkills.length === 0) continue;

        // Calculate matched skills
        const matchedMandatory = mandatorySkills.filter((skill: string) =>
          userSkills.includes(skill.toLowerCase())
        );
        const matchedOptional = optionalSkills.filter((skill: string) =>
          userSkills.includes(skill.toLowerCase())
        );
        const matchedSkills = [...matchedMandatory, ...matchedOptional];
        
        // Calculate missing mandatory skills
        const missingSkills = mandatorySkills.filter((skill: string) =>
          !userSkills.includes(skill.toLowerCase())
        );

        // Calculate match score (mandatory skills worth more)
        const mandatoryScore = mandatorySkills.length > 0 
          ? (matchedMandatory.length / mandatorySkills.length) * 70 
          : 0;
        const optionalScore = optionalSkills.length > 0 
          ? (matchedOptional.length / optionalSkills.length) * 30 
          : 0;
        const matchScore = Math.round(mandatoryScore + optionalScore);

        // Only include if at least 30% match on mandatory skills
        if (matchedMandatory.length > 0 || (mandatorySkills.length === 0 && matchedOptional.length > 0)) {
          // Check if user already added for a different role with lower score
          const existingIndex = matchedProfiles.findIndex(
            (p) => p._id === user._id.toString()
          );

          if (existingIndex >= 0) {
            // Update if this role has a better match
            if (matchScore > matchedProfiles[existingIndex].matchScore) {
              matchedProfiles[existingIndex] = {
                _id: user._id.toString(),
                name: user.name || user.fullName || "Unknown",
                email: user.email,
                avatar: user.avatar,
                skills: user.skills || user.techStack || [],
                matchedRole: role.roleName,
                matchScore,
                matchedSkills,
                missingSkills,
              };
            }
          } else {
            matchedProfiles.push({
              _id: user._id.toString(),
              name: user.name || user.fullName || "Unknown",
              email: user.email,
              avatar: user.avatar,
              skills: user.skills || user.techStack || [],
              matchedRole: role.roleName,
              matchScore,
              matchedSkills,
              missingSkills,
            });
          }
        }
      }
    }

    // Sort by match score descending
    matchedProfiles.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      profiles: matchedProfiles.slice(0, 20), // Return top 20 matches
      totalMatches: matchedProfiles.length,
    });
  } catch (error) {
    console.error("Error matching profiles:", error);
    return NextResponse.json(
      { error: "Failed to match profiles" },
      { status: 500 }
    );
  }
}
