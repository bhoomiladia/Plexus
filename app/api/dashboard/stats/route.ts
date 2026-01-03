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

    // Try to convert userId to ObjectId if it's a valid ObjectId string
    let userIdQuery: any = userId;
    try {
      if (ObjectId.isValid(userId)) {
        userIdQuery = { $in: [userId, new ObjectId(userId)] };
      }
    } catch (e) {
      // Keep as string if conversion fails
    }

    // Fetch user's owned projects
    const ownedProjects = await db
      .collection("projects")
      .find({ 
        $or: [
          { ownerId: userId },
          ...(typeof userIdQuery === 'object' && userIdQuery.$in 
            ? [{ ownerId: { $in: userIdQuery.$in } }] 
            : [])
        ]
      })
      .toArray();

    // Fetch user's accepted applications (projects they're part of)
    const acceptedApplications = await db
      .collection("applications")
      .find({ 
        $or: [
          { userId: userId },
          ...(typeof userIdQuery === 'object' && userIdQuery.$in 
            ? [{ userId: { $in: userIdQuery.$in } }] 
            : [])
        ],
        status: "ACCEPTED" 
      })
      .toArray();

    const participatingProjectIds = acceptedApplications.map(
      (app: any) => app.projectId
    );

    const participatingProjects = await db
      .collection("projects")
      .find({ _id: { $in: participatingProjectIds } })
      .toArray();

    // Total projects (owned + participating)
    const totalProjects = ownedProjects.length + participatingProjects.length;

    // Active projects (OPEN status)
    const activeProjects = [
      ...ownedProjects.filter((p: any) => p.status === "OPEN"),
      ...participatingProjects.filter((p: any) => p.status === "OPEN"),
    ].length;

    // Completed projects
    const completedProjects = [
      ...ownedProjects.filter((p: any) => p.status === "COMPLETED"),
      ...participatingProjects.filter((p: any) => p.status === "COMPLETED"),
    ].length;

    // Pending applications count
    const pendingApplications = await db
      .collection("applications")
      .countDocuments({ 
        $or: [
          { userId: userId },
          ...(typeof userIdQuery === 'object' && userIdQuery.$in 
            ? [{ userId: { $in: userIdQuery.$in } }] 
            : [])
        ],
        status: "PENDING" 
      });

    // Calculate growth (compare with last week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentProjects = await db
      .collection("projects")
      .countDocuments({
        $or: [
          { ownerId: userId },
          ...(typeof userIdQuery === 'object' && userIdQuery.$in 
            ? [{ ownerId: { $in: userIdQuery.$in } }] 
            : [])
        ],
        createdAt: { $gte: oneWeekAgo },
      });

    const recentApplications = await db
      .collection("applications")
      .countDocuments({
        $or: [
          { userId: userId },
          ...(typeof userIdQuery === 'object' && userIdQuery.$in 
            ? [{ userId: { $in: userIdQuery.$in } }] 
            : [])
        ],
        status: "ACCEPTED",
        createdAt: { $gte: oneWeekAgo },
      });

    const weeklyGrowth = recentProjects + recentApplications;
    const growthPercentage =
      totalProjects > 0 ? Math.round((weeklyGrowth / totalProjects) * 100) : 0;

    return NextResponse.json({
      totalProjects,
      activeProjects,
      completedProjects,
      pendingApplications,
      growthPercentage,
      ownedProjectsCount: ownedProjects.length,
      participatingProjectsCount: participatingProjects.length,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
