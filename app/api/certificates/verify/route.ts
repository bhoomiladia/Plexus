import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyCertificateOnChain } from "@/lib/solana";

// GET - Verify a certificate
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const certificateId = searchParams.get("certificateId");
    const txSignature = searchParams.get("txSignature");

    if (!certificateId && !txSignature) {
      return NextResponse.json(
        { error: "Certificate ID or transaction signature is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Find certificate in database
    let certificate;
    if (certificateId) {
      certificate = await db.collection("certificates").findOne({
        certificateId: certificateId,
      });
    } else if (txSignature) {
      certificate = await db.collection("certificates").findOne({
        "blockchain.transactionSignature": txSignature,
      });
    }

    if (!certificate) {
      return NextResponse.json(
        { verified: false, error: "Certificate not found in database" },
        { status: 404 }
      );
    }

    // Verify on blockchain if minted
    let blockchainVerification = null;
    if (
      certificate.status === "minted" &&
      certificate.blockchain?.transactionSignature
    ) {
      blockchainVerification = await verifyCertificateOnChain(
        certificate.blockchain.transactionSignature
      );
    }

    return NextResponse.json({
      verified: true,
      certificate: {
        certificateId: certificate.certificateId,
        userName: certificate.userName,
        taskTitle: certificate.taskTitle,
        projectName: certificate.projectName,
        role: certificate.role,
        totalTasksCompleted: certificate.totalTasksCompleted,
        issuedAt: certificate.issuedAt,
        certificateHash: certificate.certificateHash,
        status: certificate.status,
        blockchain: certificate.blockchain,
      },
      blockchainVerification,
    });
  } catch (error) {
    console.error("Error verifying certificate:", error);
    return NextResponse.json(
      { verified: false, error: "Failed to verify certificate" },
      { status: 500 }
    );
  }
}
