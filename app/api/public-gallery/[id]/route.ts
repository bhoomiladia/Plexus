import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET: Fetch single completed project details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(); // Use default database from connection string

    // Fetch the project
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(id),
      status: "COMPLETED", // Only show completed projects
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not completed" },
        { status: 404 }
      );
    }

    // Get owner info
    let ownerQuery: any = { email: project.ownerEmail };
    try {
      if (ObjectId.isValid(project.ownerId)) {
        ownerQuery = { _id: new ObjectId(project.ownerId) };
      }
    } catch (e) {
      // Fallback to email query
    }

    const owner = await db.collection("users").findOne(ownerQuery, {
      projection: { name: 1, fullName: 1, email: 1, bio: 1 },
    });

    // Get all accepted members
    const acceptedApplications = await db
      .collection("applications")
      .find({
        projectId: new ObjectId(id),
        status: "ACCEPTED",
      })
      .toArray();

    // Get member details
    const members = await Promise.all(
      acceptedApplications.map(async (app: any) => {
        const role = project.roles.find(
          (r: any) => r._id.toString() === app.roleId
        );
        return {
          userId: app.userId,
          name: app.userName,
          email: app.userEmail,
          role: role?.roleName || "Member",
        };
      })
    );

    // Add owner to members list
    const allMembers = [
      {
        userId: project.ownerId,
        name: owner?.name || owner?.fullName || "Project Owner",
        email: owner?.email || project.ownerEmail,
        role: "Owner",
        isOwner: true,
      },
      ...members.map((m) => ({ ...m, isOwner: false })),
    ];

    // Get all unique skills from roles
    const allSkills = Array.from(
      new Set(
        project.roles.flatMap((r: any) => [
          ...(r.mandatorySkills || []),
          ...(r.optionalSkills || []),
        ])
      )
    );

    return NextResponse.json({
      project: {
        _id: project._id.toString(),
        title: project.title,
        description: project.description,
        ownerId: project.ownerId,
        ownerName: owner?.name || owner?.fullName || "Unknown",
        ownerEmail: owner?.email || project.ownerEmail,
        ownerBio: owner?.bio,
        roles: project.roles || [],
        githubLink: project.githubLink,
        demoLink: project.demoLink,
        members: allMembers,
        memberCount: allMembers.length,
        skills: allSkills,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        completedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching project details:", error);
    return NextResponse.json(
      { error: "Failed to fetch project details" },
      { status: 500 }
    );
  }
}
