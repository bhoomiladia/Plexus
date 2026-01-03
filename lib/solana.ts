import {
  Connection,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { createHash } from "crypto";

// Solana Devnet configuration
const SOLANA_NETWORK = "devnet";
const SOLANA_RPC_URL = "https://api.devnet.solana.com";

// Memo Program ID
export const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

// Initialize connection
export const getConnection = () => {
  return new Connection(SOLANA_RPC_URL, "confirmed");
};

// Generate certificate hash
export const generateCertificateHash = (data: {
  certificateId: string;
  userId: string;
  userName: string;
  taskTitle: string;
  projectName?: string;
  issuedAt: Date;
}): string => {
  const hashInput = JSON.stringify({
    ...data,
    issuedAt: data.issuedAt.toISOString(),
    timestamp: Date.now(),
  });
  return createHash("sha256").update(hashInput).digest("hex");
};

// Generate unique certificate ID
export const generateCertificateId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `CERT-${timestamp}-${randomPart}`.toUpperCase();
};

// Create a memo transaction for certificate (to be signed by client wallet)
export const createCertificateMemoTransaction = async (
  walletPublicKey: PublicKey,
  certificateHash: string,
  certificateId: string
): Promise<{
  transaction: Transaction;
  blockhash: string;
  lastValidBlockHeight: number;
}> => {
  const connection = getConnection();

  // Create memo data with certificate info
  const memoData = JSON.stringify({
    type: "CERTIFICATE",
    id: certificateId,
    hash: certificateHash,
    timestamp: new Date().toISOString(),
    app: "Unirico",
  });

  // Create transaction with memo instruction
  const transaction = new Transaction().add({
    keys: [{ pubkey: walletPublicKey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoData),
  });

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = walletPublicKey;

  return { transaction, blockhash, lastValidBlockHeight };
};

// Verify certificate on blockchain
export const verifyCertificateOnChain = async (
  transactionSignature: string
): Promise<{
  verified: boolean;
  data?: any;
  error?: string;
}> => {
  try {
    const connection = getConnection();
    
    const transaction = await connection.getTransaction(transactionSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return { verified: false, error: "Transaction not found" };
    }

    // Extract memo data from transaction
    const memoInstruction = transaction.transaction.message.compiledInstructions?.find(
      (ix) => {
        const programId = transaction.transaction.message.staticAccountKeys[ix.programIdIndex];
        return programId?.toBase58() === MEMO_PROGRAM_ID.toBase58();
      }
    );

    if (memoInstruction) {
      const memoData = Buffer.from(memoInstruction.data).toString("utf-8");
      try {
        const parsedData = JSON.parse(memoData);
        return { verified: true, data: parsedData };
      } catch {
        return { verified: true, data: { raw: memoData } };
      }
    }

    return { verified: true, data: { blockTime: transaction.blockTime } };
  } catch (error: any) {
    console.error("Error verifying certificate:", error);
    return { verified: false, error: error.message };
  }
};

// Get wallet balance
export const getWalletBalance = async (publicKey: string): Promise<number> => {
  try {
    const connection = getConnection();
    const balance = await connection.getBalance(new PublicKey(publicKey));
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error("Error getting wallet balance:", error);
    return 0;
  }
};

// Request airdrop (devnet only)
export const requestAirdrop = async (
  publicKey: string,
  amount: number = 1
): Promise<{ success: boolean; signature?: string; error?: string }> => {
  try {
    const connection = getConnection();
    const signature = await connection.requestAirdrop(
      new PublicKey(publicKey),
      amount * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature, "confirmed");
    return { success: true, signature };
  } catch (error: any) {
    console.error("Error requesting airdrop:", error);
    return { success: false, error: error.message };
  }
};

// Get explorer URL for transaction
export const getExplorerUrl = (signature: string): string => {
  return `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_NETWORK}`;
};

// Get explorer URL for address
export const getAddressExplorerUrl = (address: string): string => {
  return `https://explorer.solana.com/address/${address}?cluster=${SOLANA_NETWORK}`;
};
