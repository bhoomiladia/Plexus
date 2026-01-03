import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createNewWallet,
  getWalletBalance,
  requestAirdrop,
  getWalletFromPrivateKey,
} from "@/lib/solana";

// GET - Get wallet info and balance
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secretKey = process.env.SOLANA_WALLET_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json({
        configured: false,
        message: "Solana wallet not configured. Please add SOLANA_WALLET_SECRET_KEY to .env.local",
      });
    }

    try {
      const wallet = getWalletFromPrivateKey(secretKey);
      const balance = await getWalletBalance(wallet.publicKey.toBase58());

      return NextResponse.json({
        configured: true,
        publicKey: wallet.publicKey.toBase58(),
        balance,
        network: "devnet",
        explorerUrl: `https://explorer.solana.com/address/${wallet.publicKey.toBase58()}?cluster=devnet`,
      });
    } catch (error) {
      return NextResponse.json({
        configured: false,
        error: "Invalid wallet configuration",
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

// POST - Request airdrop (devnet only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secretKey = process.env.SOLANA_WALLET_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "Wallet not configured" },
        { status: 400 }
      );
    }

    const wallet = getWalletFromPrivateKey(secretKey);
    const result = await requestAirdrop(wallet.publicKey.toBase58(), 1);

    if (result.success) {
      const newBalance = await getWalletBalance(wallet.publicKey.toBase58());
      return NextResponse.json({
        success: true,
        message: "Airdrop successful! 1 SOL added to wallet.",
        signature: result.signature,
        newBalance,
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Airdrop failed" },
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
