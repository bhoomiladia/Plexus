import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  generateCertificateId,
  generateCertificateHash,
} from "@/lib/solana";

// GET - Fetch user's certificates
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const certificates = await db
      .collection("certificates")
      .find({ userId: session.user.id })
      .sort({ issuedAt: -1 })
      .toArray();

    const formattedCertificates = certificates.map((cert: any) => ({
      _id: cert._id.toString(),
      certificateId: cert.certificateId,
      certificateHash: cert.certificateHash,
      taskTitle: cert.taskTitle,
      projectName: cert.projectName,
      userName: cert.userName,
      role: cert.role,
      totalTasksCompleted: cert.totalTasksCompleted,
      issuedAt: cert.issuedAt,
      status: cert.status,
      blockchain: cert.blockchain,
    }));

    return NextResponse.json({ certificates: formattedCertificates });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json(
      { error: "Failed to fetch certificates" },
      { status: 500 }
    );
  }
}


// POST - Generate a new certificate (minting is done separately via wallet connection)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get task details
    const task = await db.collection("tasks").findOne({
      _id: new ObjectId(taskId),
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if certificate already exists for this task
    const existingCert = await db.collection("certificates").findOne({
      userId: session.user.id,
      taskId: new ObjectId(taskId),
    });

    if (existingCert) {
      return NextResponse.json({
        certificate: {
          _id: existingCert._id.toString(),
          certificateId: existingCert.certificateId,
          certificateHash: existingCert.certificateHash,
          userName: existingCert.userName,
          taskTitle: existingCert.taskTitle,
          projectName: existingCert.projectName,
          role: existingCert.role,
          totalTasksCompleted: existingCert.totalTasksCompleted,
          issuedAt: existingCert.issuedAt,
          status: existingCert.status,
          blockchain: existingCert.blockchain,
        },
        message: "Certificate already exists for this task",
      });
    }

    // Get project details if available
    let projectName = "Unirico";
    if (task.projectId) {
      const project = await db.collection("projects").findOne({
        _id: new ObjectId(task.projectId),
      });
      if (project) {
        projectName = project.title;
      }
    }

    // Count total completed tasks for user
    const completedTasksCount = await db.collection("tasks").countDocuments({
      userId: session.user.id,
      status: "completed",
    });

    // Generate certificate data
    const certificateId = generateCertificateId();
    const issuedAt = new Date();

    const certificateHash = generateCertificateHash({
      certificateId,
      userId: session.user.id,
      userName: session.user.name || "User",
      taskTitle: task.title,
      projectName,
      issuedAt,
    });

    // Create certificate record (pending status - user needs to connect wallet to mint)
    const certificate = {
      userId: session.user.id,
      userName: session.user.name || "User",
      userEmail: session.user.email || "",
      taskId: new ObjectId(taskId),
      taskTitle: task.title,
      projectId: task.projectId,
      projectName,
      certificateId,
      certificateHash,
      totalTasksCompleted: completedTasksCount,
      role: task.assignedToName ? "Team Member" : "Contributor",
      issuedAt,
      blockchain: {
        network: "solana-devnet",
        transactionSignature: null,
        walletAddress: null,
        explorerUrl: null,
      },
      status: "pending",
    };

    const result = await db.collection("certificates").insertOne(certificate);

    return NextResponse.json({
      success: true,
      certificate: {
        _id: result.insertedId.toString(),
        certificateId: certificate.certificateId,
        certificateHash: certificate.certificateHash,
        userName: certificate.userName,
        taskTitle: certificate.taskTitle,
        projectName: certificate.projectName,
        role: certificate.role,
        totalTasksCompleted: certificate.totalTasksCompleted,
        issuedAt: certificate.issuedAt,
        status: certificate.status,
        blockchain: certificate.blockchain,
      },
      message: "Certificate created. Connect your wallet to mint it on-chain.",
    });
  } catch (error) {
    console.error("Error creating certificate:", error);
    return NextResponse.json(
      { error: "Failed to create certificate" },
      { status: 500 }
    );
  }
}
