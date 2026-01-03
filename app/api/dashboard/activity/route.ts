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

    const userQuery = userObjectId
      ? { $or: [{ userId: userId }, { userId: userObjectId }] }
      : { userId: userId };

    const ownerQuery = userObjectId
      ? { $or: [{ ownerId: userId }, { ownerId: userObjectId }] }
      : { ownerId: userId };

    // Fetch recent activities from multiple sources
    const [recentApplications, recentProjects, recentNotifications] = await Promise.all([
      // User's recent applications
      db.collection("applications")
        .find(userQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
      
      // User's recent projects
      db.collection("projects")
        .find(ownerQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
      
      // Recent notifications
      db.collection("notifications")
        .find(userQuery)
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray(),
    ]);

    // Combine and format activities
    const activities: any[] = [];

    recentApplications.forEach((app: any) => {
      activities.push({
        id: app._id.toString(),
        type: "application",
        title: `Application ${app.status.toLowerCase()}`,
        description: `Your application status: ${app.status}`,
        status: app.status,
        timestamp: app.createdAt || app.updatedAt,
        link: `/dashboard/projects/${app.projectId}`,
      });
    });

    recentProjects.forEach((project: any) => {
      activities.push({
        id: project._id.toString(),
        type: "project",
        title: `Project: ${project.title}`,
        description: project.status === "OPEN" ? "Project is open for applications" : "Project completed",
        status: project.status,
        timestamp: project.createdAt,
        link: `/dashboard/projects/manage/${project._id}`,
      });
    });

    recentNotifications.forEach((notif: any) => {
      activities.push({
        id: notif._id.toString(),
        type: "notification",
        title: notif.title,
        description: notif.message,
        status: notif.read ? "read" : "unread",
        timestamp: notif.createdAt,
        link: notif.link || "/dashboard/notifications",
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      activities: activities.slice(0, 10),
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
