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
    const db = client.db(); // Use default database from connection string
    const userId = session.user.id;

    console.log(`Fetching recommendations for user: ${userId}`);

    // Get user's skills - handle both string and ObjectId
    let userObjectId: ObjectId | null = null;
    try {
      if (ObjectId.isValid(userId)) {
        userObjectId = new ObjectId(userId);
      }
    } catch (e) {
      // Keep as null if conversion fails
    }

    const userQuery = userObjectId 
      ? { _id: userObjectId }
      : { email: session.user.email };

    const user = await db.collection("users").findOne(
      userQuery,
      { projection: { skills: 1, techStack: 1 } }
    );

    const userSkills = user?.skills || user?.techStack || [];

    console.log(`User skills: ${userSkills.join(", ")}`);

    if (userSkills.length === 0) {
      console.log("No user skills found, returning random projects");
      // Return random open projects if user has no skills
      const randomProjects = await db
        .collection("projects")
        .find({
          ownerId: { $ne: userId },
          status: "OPEN",
        })
        .limit(10) // Return up to 10 random projects
        .toArray();

      console.log(`Found ${randomProjects.length} random projects`);

      return NextResponse.json({
        recommendations: randomProjects.map((p: any) => ({
          _id: p._id.toString(),
          title: p.title,
          description: p.description,
          ownerId: p.ownerId,
          roles: p.roles || [],
          matchScore: 0,
        })),
      });
    }

    // Build owner exclusion query
    const ownerExclusion = userObjectId
      ? { $nor: [{ ownerId: userId }, { ownerId: userObjectId }] }
      : { ownerId: { $ne: userId } };

    // Find projects where user hasn't applied and match skills
    const allOpenProjects = await db
      .collection("projects")
      .find({
        status: "OPEN",
        ...ownerExclusion,
      })
      .toArray();

    // Build user application query
    const userAppQuery = userObjectId
      ? { $or: [{ userId: userId }, { userId: userObjectId }] }
      : { userId: userId };

    // Get user's applications to filter out already applied projects
    const userApplications = await db
      .collection("applications")
      .find(userAppQuery)
      .toArray();

    const appliedProjectIds = userApplications.map((app: any) =>
      app.projectId.toString()
    );

    // Score and filter projects
    const scoredProjects = allOpenProjects
      .filter((p: any) => !appliedProjectIds.includes(p._id.toString()))
      .map((project: any) => {
        let matchScore = 0;
        const roles = project.roles || [];

        // Calculate match score based on skills
        roles.forEach((role: any) => {
          const mandatorySkills = role.mandatorySkills || [];
          const optionalSkills = role.optionalSkills || [];

          mandatorySkills.forEach((skill: string) => {
            if (
              userSkills.some(
                (us: string) => us.toLowerCase() === skill.toLowerCase()
              )
            ) {
              matchScore += 10;
            }
          });

          optionalSkills.forEach((skill: string) => {
            if (
              userSkills.some(
                (us: string) => us.toLowerCase() === skill.toLowerCase()
              )
            ) {
              matchScore += 5;
            }
          });
        });

        return {
          _id: project._id.toString(),
          title: project.title,
          description: project.description,
          ownerId: project.ownerId,
          roles: project.roles || [],
          matchScore,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Return top 10 recommendations

    console.log(`Returning ${scoredProjects.length} recommendations`);

    return NextResponse.json({
      recommendations: scoredProjects,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
