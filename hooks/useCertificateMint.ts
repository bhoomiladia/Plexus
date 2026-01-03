"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";

interface MintResult {
  success: boolean;
  transactionSignature?: string;
  explorerUrl?: string;
  error?: string;
}

export function useCertificateMint() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mintCertificate = useCallback(
    async (certificateId: string): Promise<MintResult> => {
      if (!connected || !publicKey || !signTransaction) {
        return {
          success: false,
          error: "Wallet not connected. Please connect your wallet first.",
        };
      }

      setIsMinting(true);
      setError(null);

      try {
        // Step 1: Request transaction from server
        const createResponse = await fetch("/api/certificates/mint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            certificateId,
            walletAddress: publicKey.toBase58(),
          }),
        });

        const createData = await createResponse.json();

        if (!createResponse.ok) {
          throw new Error(createData.error || "Failed to create transaction");
        }

        // If already minted, return success
        if (createData.success && !createData.requiresSignature) {
          return {
            success: true,
            transactionSignature: createData.blockchain?.transactionSignature,
            explorerUrl: createData.blockchain?.explorerUrl,
          };
        }

        // Step 2: Sign the transaction with wallet
        if (createData.requiresSignature && createData.transaction) {
          const transactionBuffer = Buffer.from(createData.transaction, "base64");
          const transaction = Transaction.from(transactionBuffer);

          // Sign with wallet
          const signedTransaction = await signTransaction(transaction);

          // Step 3: Send signed transaction back to server
          const mintResponse = await fetch("/api/certificates/mint", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              certificateId,
              walletAddress: publicKey.toBase58(),
              signedTransaction: signedTransaction.serialize().toString("base64"),
            }),
          });

          const mintData = await mintResponse.json();

          if (!mintResponse.ok) {
            throw new Error(mintData.error || "Failed to mint certificate");
          }

          return {
            success: true,
            transactionSignature: mintData.blockchain?.transactionSignature,
            explorerUrl: mintData.blockchain?.explorerUrl,
          };
        }

        throw new Error("Unexpected response from server");
      } catch (err: any) {
        const errorMessage = err.message || "Failed to mint certificate";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsMinting(false);
      }
    },
    [connected, publicKey, signTransaction]
  );

  return {
    mintCertificate,
    isMinting,
    error,
    isWalletConnected: connected,
    walletAddress: publicKey?.toBase58(),
  };
}

export default useCertificateMint;
