import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          password: 0, // Exclude sensitive data
        },
      }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user stats
    const [ownedProjects, acceptedApplications, completedProjects] = await Promise.all([
      db.collection("projects").countDocuments({ ownerId: userId }),
      db.collection("applications").countDocuments({ userId: userId, status: "ACCEPTED" }),
      db.collection("projects").countDocuments({ ownerId: userId, status: "COMPLETED" }),
    ]);

    return NextResponse.json({
      ...user,
      _id: user._id.toString(),
      name: user.name || user.fullName || "Unknown",
      techStack: user.skills || user.techStack || [],
      experience: user.experience || [],
      education: user.education || [],
      readme: user.readme || "",
      links: user.links || {},
      stats: {
        projectsOwned: ownedProjects,
        projectsJoined: acceptedApplications,
        projectsCompleted: completedProjects,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
