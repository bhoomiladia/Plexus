import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

// GET: Fetch all completed projects for public gallery
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(); // Use default database from connection string

    // Fetch all completed projects
    const completedProjects = await db
      .collection("projects")
      .find({ status: "COMPLETED" })
      .sort({ updatedAt: -1 }) // Most recently completed first
      .toArray();

    // Get owner details and member count for each project
    const projectsWithDetails = await Promise.all(
      completedProjects.map(async (project: any) => {
        // Get owner info
        let ownerQuery: any = { email: project.ownerEmail };
        try {
          const { ObjectId } = require("mongodb");
          if (ObjectId.isValid(project.ownerId)) {
            ownerQuery = { _id: new ObjectId(project.ownerId) };
          }
        } catch (e) {
          // Fallback to email query
        }

        const owner = await db.collection("users").findOne(ownerQuery, {
          projection: { name: 1, fullName: 1, email: 1 },
        });

        // Count accepted members
        const memberCount = await db.collection("applications").countDocuments({
          projectId: project._id,
          status: "ACCEPTED",
        });

        return {
          _id: project._id.toString(),
          title: project.title,
          description: project.description,
          ownerId: project.ownerId,
          ownerName: owner?.name || owner?.fullName || "Unknown",
          ownerEmail: owner?.email || project.ownerEmail,
          roles: project.roles || [],
          githubLink: project.githubLink,
          demoLink: project.demoLink,
          memberCount: memberCount + 1, // +1 for owner
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          completedAt: project.updatedAt, // When status changed to COMPLETED
        };
      })
    );

    return NextResponse.json({ projects: projectsWithDetails });
  } catch (error) {
    console.error("Error fetching public gallery:", error);
    return NextResponse.json(
      { error: "Failed to fetch completed projects" },
      { status: 500 }
    );
  }
}
