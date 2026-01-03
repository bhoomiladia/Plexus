import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  Connection,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const SOLANA_RPC_URL = "https://api.devnet.solana.com";
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

// POST - Mint an existing certificate on blockchain using connected wallet
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { certificateId, walletAddress, signedTransaction } = body;

    if (!certificateId) {
      return NextResponse.json(
        { error: "Certificate ID is required" },
        { status: 400 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
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

    // If signedTransaction is provided, broadcast it
    if (signedTransaction) {
      try {
        const connection = new Connection(SOLANA_RPC_URL, "confirmed");
        const txBuffer = Buffer.from(signedTransaction, "base64");
        const signature = await connection.sendRawTransaction(txBuffer, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });

        await connection.confirmTransaction(signature, "confirmed");

        const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

        // Update certificate in database
        await db.collection("certificates").updateOne(
          { _id: new ObjectId(certificateId) },
          {
            $set: {
              status: "minted",
              "blockchain.transactionSignature": signature,
              "blockchain.explorerUrl": explorerUrl,
              "blockchain.walletAddress": walletAddress,
              mintedAt: new Date(),
            },
          }
        );

        return NextResponse.json({
          success: true,
          message: "Certificate minted successfully",
          blockchain: {
            network: "solana-devnet",
            transactionSignature: signature,
            explorerUrl,
            walletAddress,
          },
        });
      } catch (error: any) {
        console.error("Error broadcasting transaction:", error);
        return NextResponse.json(
          { error: error.message || "Failed to broadcast transaction" },
          { status: 500 }
        );
      }
    }

    // If no signed transaction, create one for the client to sign
    try {
      const connection = new Connection(SOLANA_RPC_URL, "confirmed");
      const walletPubkey = new PublicKey(walletAddress);

      // Check wallet balance
      const balance = await connection.getBalance(walletPubkey);
      if (balance < 0.001 * LAMPORTS_PER_SOL) {
        return NextResponse.json(
          {
            error: "Insufficient SOL balance. Please fund your wallet on devnet.",
            needsFunding: true,
            walletAddress,
            currentBalance: balance / LAMPORTS_PER_SOL,
          },
          { status: 400 }
        );
      }

      // Create memo data with certificate info
      const memoData = JSON.stringify({
        type: "CERTIFICATE",
        id: certificate.certificateId,
        hash: certificate.certificateHash,
        timestamp: new Date().toISOString(),
        app: "Unirico",
      });

      // Create transaction with memo instruction
      const transaction = new Transaction().add({
        keys: [{ pubkey: walletPubkey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoData),
      });

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletPubkey;

      // Serialize the transaction for client signing
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      return NextResponse.json({
        success: true,
        requiresSignature: true,
        transaction: serializedTransaction.toString("base64"),
        blockhash,
        lastValidBlockHeight,
        message: "Transaction created. Please sign with your wallet.",
      });
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      await db.collection("certificates").updateOne(
        { _id: new ObjectId(certificateId) },
        { $set: { status: "failed" } }
      );

      return NextResponse.json(
        { error: error.message || "Failed to create transaction" },
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
