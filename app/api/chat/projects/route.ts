import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET: Fetch all projects where user is owner or accepted member
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(); // Use default database from connection string
    const userId = session.user.id;

    console.log(`Fetching chat projects for user: ${userId}`);

    // Handle both string and ObjectId user IDs
    let userObjectId: ObjectId | null = null;
    try {
      if (ObjectId.isValid(userId)) {
        userObjectId = new ObjectId(userId);
      }
    } catch (e) {
      // Keep as null if conversion fails
    }

    // Find projects where user is owner
    // Projects store ownerId as string, so we need to check both formats
    const ownedProjects = await db
      .collection("projects")
      .find({
        ownerId: userId, // Check as string
      })
      .toArray();

    console.log(`User ${userId} owns ${ownedProjects.length} projects`);

    // Find accepted applications
    const acceptedApplications = await db
      .collection("applications")
      .find({
        userId: userId, // Applications store userId as string
        status: "ACCEPTED",
      })
      .toArray();

    console.log(`User ${userId} has ${acceptedApplications.length} accepted applications`);

    // Get project IDs from accepted applications
    const participatingProjectIds = acceptedApplications.map(
      (app: any) => app.projectId
    );

    // Fetch participating projects
    const participatingProjects = await db
      .collection("projects")
      .find({
        _id: { $in: participatingProjectIds },
      })
      .toArray();

    // Combine all projects (remove duplicates)
    const allProjectIds = new Set<string>();
    const allProjects: any[] = [];
    
    ownedProjects.forEach((project: any) => {
      const id = project._id.toString();
      if (!allProjectIds.has(id)) {
        allProjectIds.add(id);
        allProjects.push(project);
      }
    });
    
    participatingProjects.forEach((project: any) => {
      const id = project._id.toString();
      if (!allProjectIds.has(id)) {
        allProjectIds.add(id);
        allProjects.push(project);
      }
    });

    console.log(`Total unique projects for user: ${allProjects.length}`);

    // Get member counts and last messages for each project
    const projectsWithDetails = await Promise.all(
      allProjects.map(async (project: any) => {
        // Count accepted members + owner
        const memberCount = await db.collection("applications").countDocuments({
          projectId: project._id,
          status: "ACCEPTED",
        });

        // Get last message
        const lastMessage = await db
          .collection("messages")
          .findOne(
            { projectId: project._id },
            { sort: { createdAt: -1 } }
          );

        return {
          _id: project._id.toString(),
          title: project.title,
          ownerId: project.ownerId,
          memberCount: memberCount + 1, // +1 for owner
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
              }
            : null,
        };
      })
    );

    // Sort by last message time (most recent first)
    projectsWithDetails.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime()
      );
    });

    console.log(`Returning ${projectsWithDetails.length} projects to client`);
    return NextResponse.json({ projects: projectsWithDetails });
  } catch (error) {
    console.error("Error fetching chat projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
