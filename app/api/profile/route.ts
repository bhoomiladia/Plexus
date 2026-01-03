import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/* ================= GET PROFILE ================= */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db();
  const userId = session.user.id;

  const user = await db.collection("users").findOne(
    { _id: new ObjectId(userId) },
    {
      projection: {
        fullName: 1,
        name: 1,
        username: 1,
        email: 1,
        bio: 1,
        location: 1,
        techStack: 1,
        skills: 1,
        readme: 1,
        links: 1,
        avatar: 1,
        experience: 1,
        education: 1,
        achievements: 1,
        availability: 1,
        hourlyRate: 1,
        createdAt: 1,
      },
    }
  );

  // Generate username from email if not set
  const generatedUsername = session.user.email?.split("@")[0] || "user";

  // Fetch user stats
  const [ownedProjects, acceptedApplications, completedProjects] = await Promise.all([
    db.collection("projects").countDocuments({ ownerId: userId }),
    db.collection("applications").countDocuments({ userId: userId, status: "ACCEPTED" }),
    db.collection("projects").countDocuments({ ownerId: userId, status: "COMPLETED" }),
  ]);

  // Calculate profile completeness
  const profileFields = [
    user?.name || user?.fullName,
    user?.bio,
    user?.location,
    (user?.techStack || user?.skills)?.length > 0,
    user?.readme,
    user?.links?.github || user?.links?.linkedin,
    user?.experience?.length > 0,
    user?.education?.length > 0,
  ];
  const completedFields = profileFields.filter(Boolean).length;
  const profileCompleteness = Math.round((completedFields / profileFields.length) * 100);

  return NextResponse.json({
    ...user,
    name: user?.name || user?.fullName || session.user.name,
    username: user?.username || generatedUsername,
    email: session.user.email,
    techStack: user?.skills || user?.techStack || [],
    experience: user?.experience || [],
    education: user?.education || [],
    achievements: user?.achievements || [],
    links: user?.links || {},
    stats: {
      projectsOwned: ownedProjects,
      projectsJoined: acceptedApplications,
      projectsCompleted: completedProjects,
      profileCompleteness,
    },
  });
}

/* ================= UPDATE PROFILE ================= */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const allowedFields = [
    "name",
    "fullName",
    "bio",
    "location",
    "techStack",
    "skills",
    "readme",
    "username",
    "links",
    "avatar",
    "experience",
    "education",
    "achievements",
    "availability",
    "hourlyRate",
  ];

  const updateData = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key))
  );

  // If name is being updated, also update fullName for consistency
  if (updateData.name) {
    updateData.fullName = updateData.name;
  }

  // If techStack is being updated, also update skills for consistency
  if (updateData.techStack) {
    updateData.skills = updateData.techStack;
  }

  // If skills is being updated, also update techStack for consistency
  if (updateData.skills) {
    updateData.techStack = updateData.skills;
  }

  const client = await clientPromise;
  const db = client.db();

  await db.collection("users").updateOne(
    { _id: new ObjectId(session.user.id) },
    {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({ success: true });
}
