import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  generateCertificateId,
  generateCertificateHash,
  storeCertificateOnChain,
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


// POST - Generate and mint a new certificate
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, mintOnChain = false } = body;

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

    // Create certificate record
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
        mintAddress: null,
        metadataUri: null,
        explorerUrl: null,
      },
      status: "pending",
    };

    const result = await db.collection("certificates").insertOne(certificate);

    // Mint on blockchain if requested and wallet is configured
    let blockchainResult = null;
    if (mintOnChain && process.env.SOLANA_WALLET_SECRET_KEY) {
      blockchainResult = await storeCertificateOnChain(
        certificateHash,
        certificateId,
        process.env.SOLANA_WALLET_SECRET_KEY
      );

      if (blockchainResult.success) {
        await db.collection("certificates").updateOne(
          { _id: result.insertedId },
          {
            $set: {
              status: "minted",
              "blockchain.transactionSignature": blockchainResult.transactionSignature,
              "blockchain.explorerUrl": blockchainResult.explorerUrl,
            },
          }
        );
        (certificate as any).status = "minted";
        (certificate as any).blockchain.transactionSignature = blockchainResult.transactionSignature || null;
        (certificate as any).blockchain.explorerUrl = blockchainResult.explorerUrl || null;
      }
    }

    return NextResponse.json({
      success: true,
      certificate: {
        _id: result.insertedId.toString(),
        ...certificate,
        taskId: taskId,
        projectId: task.projectId?.toString(),
      },
      blockchainResult,
    });
  } catch (error) {
    console.error("Error creating certificate:", error);
    return NextResponse.json(
      { error: "Failed to create certificate" },
      { status: 500 }
    );
  }
}
