import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { storeCertificateOnChain } from "@/lib/solana";

// POST - Mint an existing certificate on blockchain
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { certificateId } = body;

    if (!certificateId) {
      return NextResponse.json(
        { error: "Certificate ID is required" },
        { status: 400 }
      );
    }

    // Check if wallet is configured
    if (!process.env.SOLANA_WALLET_SECRET_KEY) {
      return NextResponse.json(
        { error: "Blockchain wallet not configured" },
        { status: 500 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Find certificate
    const certificate = await db.collection("certificates").findOne({
      _id: new ObjectId(certificateId),
      userId: session.user.id,
    });

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    if (certificate.status === "minted") {
      return NextResponse.json({
        success: true,
        message: "Certificate already minted",
        blockchain: certificate.blockchain,
      });
    }

    // Store on blockchain
    const blockchainResult = await storeCertificateOnChain(
      certificate.certificateHash,
      certificate.certificateId,
      process.env.SOLANA_WALLET_SECRET_KEY
    );

    if (blockchainResult.success) {
      await db.collection("certificates").updateOne(
        { _id: new ObjectId(certificateId) },
        {
          $set: {
            status: "minted",
            "blockchain.transactionSignature":
              blockchainResult.transactionSignature,
            "blockchain.explorerUrl": blockchainResult.explorerUrl,
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: "Certificate minted successfully",
        blockchain: {
          network: "solana-devnet",
          transactionSignature: blockchainResult.transactionSignature,
          explorerUrl: blockchainResult.explorerUrl,
        },
      });
    } else {
      await db.collection("certificates").updateOne(
        { _id: new ObjectId(certificateId) },
        { $set: { status: "failed" } }
      );

      return NextResponse.json(
        { error: blockchainResult.error || "Failed to mint certificate" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error minting certificate:", error);
    return NextResponse.json(
      { error: "Failed to mint certificate" },
      { status: 500 }
    );
  }
}
