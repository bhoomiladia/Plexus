import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET: Fetch all projects where user is owner, accepted member, or authorized personnel
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const userId = session.user.id;
    const userEmail = session.user.email;

    console.log(`Fetching chat projects for user: ${userId}, email: ${userEmail}`);

    // Find projects where user is owner
    const ownedProjects = await db
      .collection("projects")
      .find({ ownerId: userId })
      .toArray();

    console.log(`User owns ${ownedProjects.length} projects`);

    // Find accepted applications (check both userId and userEmail)
    const appQuery: any = { status: "ACCEPTED" };
    if (userEmail) {
      appQuery.$or = [
        { userId: userId },
        { userEmail: userEmail }
      ];
    } else {
      appQuery.userId = userId;
    }
    
    const acceptedApplications = await db
      .collection("applications")
      .find(appQuery)
      .toArray();

    console.log(`User has ${acceptedApplications.length} accepted applications`);

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

    // Find projects where user is authorized personnel
    const authorizedQuery: any[] = [];
    if (userEmail) {
      authorizedQuery.push({ "authorizedPersonnel.userEmail": userEmail });
    }
    authorizedQuery.push({ "authorizedPersonnel.userId": userId });

    const authorizedProjects = await db
      .collection("projects")
      .find({ $or: authorizedQuery })
      .toArray();

    console.log(`User is authorized in ${authorizedProjects.length} projects`);

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

    authorizedProjects.forEach((project: any) => {
      const id = project._id.toString();
      if (!allProjectIds.has(id)) {
        allProjectIds.add(id);
        allProjects.push(project);
      }
    });

    console.log(`Total unique projects: ${allProjects.length}`);

    // Get member counts and last messages for each project
    const projectsWithDetails = await Promise.all(
      allProjects.map(async (project: any) => {
        // Count accepted members + owner + authorized personnel
        const memberCount = await db.collection("applications").countDocuments({
          projectId: project._id,
          status: "ACCEPTED",
        });
        
        const authorizedCount = project.authorizedPersonnel?.length || 0;

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
          memberCount: memberCount + 1 + authorizedCount,
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

    return NextResponse.json({ projects: projectsWithDetails });
  } catch (error) {
    console.error("Error fetching chat projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
