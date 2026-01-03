import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const SOLANA_RPC_URL = "https://api.devnet.solana.com";

// GET - Get wallet info and balance for a connected wallet
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get("address");

    if (!walletAddress) {
      return NextResponse.json({
        configured: false,
        message: "No wallet address provided. Please connect your Solana wallet.",
      });
    }

    try {
      const connection = new Connection(SOLANA_RPC_URL, "confirmed");
      const publicKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(publicKey);

      return NextResponse.json({
        configured: true,
        publicKey: walletAddress,
        balance: balance / LAMPORTS_PER_SOL,
        network: "devnet",
        explorerUrl: `https://explorer.solana.com/address/${walletAddress}?cluster=devnet`,
      });
    } catch (error) {
      return NextResponse.json({
        configured: false,
        error: "Invalid wallet address",
      });
    }
  } catch (error) {
    console.error("Error getting wallet info:", error);
    return NextResponse.json(
      { error: "Failed to get wallet info" },
      { status: 500 }
    );
  }
}

// POST - Request airdrop for connected wallet (devnet only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { walletAddress, amount = 1 } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    try {
      const connection = new Connection(SOLANA_RPC_URL, "confirmed");
      const publicKey = new PublicKey(walletAddress);
      
      const signature = await connection.requestAirdrop(
        publicKey,
        amount * LAMPORTS_PER_SOL
      );
      
      await connection.confirmTransaction(signature, "confirmed");
      
      const newBalance = await connection.getBalance(publicKey);

      return NextResponse.json({
        success: true,
        message: `Airdrop successful! ${amount} SOL added to wallet.`,
        signature,
        newBalance: newBalance / LAMPORTS_PER_SOL,
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      });
    } catch (error: any) {
      console.error("Error requesting airdrop:", error);
      return NextResponse.json(
        { error: error.message || "Airdrop failed. Try again later." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error requesting airdrop:", error);
    return NextResponse.json(
      { error: "Failed to request airdrop" },
      { status: 500 }
    );
  }
}
