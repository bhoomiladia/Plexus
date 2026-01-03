import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET: Fetch all members of a project
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Get project
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify user has access
    const isOwner = project.ownerId === session.user.id ||
                    project.ownerId === session.user.id.toString();
    
    // Check if user is authorized personnel
    const isAuthorized = project.authorizedPersonnel?.some(
      (p: any) => p.userEmail === session.user.email || p.userId === session.user.id
    );
    
    let hasAcceptedApplication = null;
    if (!isOwner && !isAuthorized) {
      // Check by both userId and userEmail
      const appQuery: any = {
        projectId: new ObjectId(projectId),
        status: "ACCEPTED",
      };
      if (session.user.email) {
        appQuery.$or = [
          { userId: session.user.id },
          { userEmail: session.user.email }
        ];
      } else {
        appQuery.userId = session.user.id;
      }
      hasAcceptedApplication = await db.collection("applications").findOne(appQuery);
    }

    if (!isOwner && !isAuthorized && !hasAcceptedApplication) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get owner details
    let ownerQuery: any = { email: project.ownerEmail };
    try {
      if (ObjectId.isValid(project.ownerId)) {
        ownerQuery = { _id: new ObjectId(project.ownerId) };
      }
    } catch (e) {
      // Fallback to email query
    }

    const owner = await db.collection("users").findOne(ownerQuery, {
      projection: { name: 1, fullName: 1, email: 1 },
    });

    const members = [
      {
        userId: project.ownerId,
        name: owner?.name || owner?.fullName || "Project Owner",
        email: owner?.email || "",
        role: "Owner",
        isOwner: true,
      },
    ];

    // Get accepted members
    const acceptedApplications = await db
      .collection("applications")
      .find({
        projectId: new ObjectId(projectId),
        status: "ACCEPTED",
      })
      .toArray();

    for (const app of acceptedApplications) {
      // Find role name
      const role = project.roles.find(
        (r: any) => r._id.toString() === app.roleId
      );

      members.push({
        userId: app.userId,
        name: app.userName,
        email: app.userEmail,
        role: role?.roleName || "Member",
        isOwner: false,
      });
    }

    // Add authorized personnel
    if (project.authorizedPersonnel && project.authorizedPersonnel.length > 0) {
      for (const authUser of project.authorizedPersonnel) {
        // Avoid duplicates (in case someone is both authorized and has an application)
        if (!members.some(m => m.email === authUser.userEmail)) {
          members.push({
            userId: authUser.userId,
            name: authUser.userName,
            email: authUser.userEmail,
            role: "Authorized Personnel",
            isOwner: false,
          });
        }
      }
    }

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
