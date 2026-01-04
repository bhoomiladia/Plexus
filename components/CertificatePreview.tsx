"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Transaction, PublicKey } from "@solana/web3.js";
import {
  X,
  Download,
  ExternalLink,
  CheckCircle,
  Loader2,
  Award,
  Shield,
  Copy,
  Check,
  Wallet,
  Lock,
} from "lucide-react";

interface CertificateData {
  _id: string;
  certificateId: string;
  certificateHash: string;
  userName: string;
  taskTitle: string;
  projectName: string;
  role: string;
  totalTasksCompleted: number;
  issuedAt: string;
  status: "pending" | "minted" | "failed";
  blockchain?: {
    network: string;
    transactionSignature?: string;
    explorerUrl?: string;
  };
}

interface CertificatePreviewProps {
  certificate: CertificateData;
  isOpen: boolean;
  onClose: () => void;
  onMint?: () => Promise<void>;
  onMintWithWallet?: (walletAddress: string) => Promise<void>;
}

export default function CertificatePreview({
  certificate,
  isOpen,
  onClose,
  onMint,
  onMintWithWallet,
}: CertificatePreviewProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const handleConnectWallet = () => {
    setVisible(true);
  };

  const handleMint = async () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    setIsMinting(true);
    setMintError(null);
    
    try {
      if (onMintWithWallet) {
        await onMintWithWallet(publicKey.toBase58());
      } else if (onMint) {
        await onMint();
      }
    } catch (error: any) {
      console.error("Minting error:", error);
      setMintError(error.message || "Failed to mint certificate");
    } finally {
      setIsMinting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isMinted = certificate.status === "minted";
  const canViewCertificate = isMinted;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[var(--theme-card)] rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Award className="text-[var(--theme-accent)]" size={24} />
                <h2 className="text-xl font-black text-[#F0F4F2] uppercase tracking-wider">
                  Certificate Preview
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <X size={20} className="text-[#F0F4F2]" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Certificate Visual */}
              <div className="relative">
                <div
                  className={`rounded-2xl overflow-hidden shadow-2xl transition-all ${
                    !canViewCertificate ? "filter blur-sm" : ""
                  }`}
                  style={{
                    background: "linear-gradient(135deg, #d4e7d4 0%, #f0f4e8 50%, #e8f0e0 100%)",
                  }}
                >
                  <div className="p-8 min-h-[400px] flex flex-col">
                    {/* Logo */}
                    <p className="text-[var(--theme-card)] font-black text-lg">Unirico</p>
                    
                    {/* Title */}
                    <h3 className="text-2xl font-black text-[var(--theme-card)] mt-6 text-center uppercase tracking-wider">
                      Certificate of Contribution
                    </h3>
                    
                    <p className="text-center text-[var(--theme-muted)] mt-4 text-sm">
                      This certificate is proudly awarded to:
                    </p>
                    
                    {/* Name */}
                    <h4 className="text-3xl font-black text-[var(--theme-card)] text-center mt-2 uppercase">
                      {certificate.userName}
                    </h4>
                    
                    <p className="text-center text-[var(--theme-muted)] mt-4 text-sm px-4">
                      In recognition of their significant contributions to the{" "}
                      <span className="font-bold">{certificate.projectName}</span> ecosystem.
                    </p>

                    <div className="mt-auto pt-6 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[var(--theme-muted)] text-xs">Awarded on:</p>
                        <p className="text-[var(--theme-card)] font-bold">
                          {formatDate(certificate.issuedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--theme-muted)] text-xs">Total Tasks Completed:</p>
                        <p className="text-[var(--theme-card)] font-bold">
                          {certificate.totalTasksCompleted}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--theme-muted)] text-xs">Role:</p>
                        <p className="text-[var(--theme-card)] font-bold">{certificate.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--theme-muted)] text-xs">Certificate ID:</p>
                        <p className="text-[var(--theme-card)] font-bold text-xs">
                          {certificate.certificateId}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lock Overlay for unminted certificates */}
                {!canViewCertificate && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-2xl">
                    <Lock size={48} className="text-white/80 mb-3" />
                    <p className="text-white font-bold text-lg">Certificate Locked</p>
                    <p className="text-white/70 text-sm mt-1">Mint to unlock</p>
                  </div>
                )}

                {/* Status Badge */}
                <div
                  className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 ${
                    certificate.status === "minted"
                      ? "bg-green-500/20 text-green-400"
                      : certificate.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {certificate.status === "minted" && <CheckCircle size={12} />}
                  {certificate.status === "minted"
                    ? "On-Chain"
                    : certificate.status === "pending"
                      ? "Pending"
                      : "Failed"}
                </div>
              </div>

              {/* Certificate Details */}
              <div className="space-y-4">
                {/* Wallet Connection Section */}
                <div className="bg-[var(--theme-card-alt)] rounded-2xl p-5 border border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Wallet className="text-[var(--theme-accent)]" size={18} />
                    <h4 className="text-sm font-bold text-[#F0F4F2] uppercase tracking-wider">
                      Wallet Connection
                    </h4>
                  </div>

                  {connected && publicKey ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sm text-green-400 font-medium">Connected</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--theme-accent)]/60 uppercase tracking-wider mb-1">
                          Wallet Address
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-[#F0F4F2] font-mono bg-[var(--theme-card)] px-3 py-2 rounded-lg flex-1 truncate">
                            {publicKey.toBase58()}
                          </p>
                          <button
                            onClick={() => copyToClipboard(publicKey.toBase58())}
                            className="p-2 bg-[var(--theme-card)] rounded-lg hover:bg-white/10 transition-all"
                          >
                            {copied ? (
                              <Check size={14} className="text-green-400" />
                            ) : (
                              <Copy size={14} className="text-[var(--theme-accent)]" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-[#F0F4F2]/70">
                        Connect your Solana wallet to mint this certificate on-chain.
                      </p>
                      <button
                        onClick={handleConnectWallet}
                        className="w-full py-3 bg-[var(--theme-accent)] text-[var(--theme-card)] rounded-xl font-bold uppercase tracking-wider text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                      >
                        <Wallet size={16} />
                        Connect Wallet
                      </button>
                    </div>
                  )}
                </div>

                {/* Blockchain Info */}
                <div className="bg-[var(--theme-card-alt)] rounded-2xl p-5 border border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="text-[var(--theme-accent)]" size={18} />
                    <h4 className="text-sm font-bold text-[#F0F4F2] uppercase tracking-wider">
                      Blockchain Verification
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-[var(--theme-accent)]/60 uppercase tracking-wider mb-1">
                        Network
                      </p>
                      <p className="text-sm text-[#F0F4F2] font-medium">
                        Solana Devnet
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-[var(--theme-accent)]/60 uppercase tracking-wider mb-1">
                        Certificate Hash
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-[#F0F4F2] font-mono bg-[var(--theme-card)] px-3 py-2 rounded-lg flex-1 truncate">
                          {certificate.certificateHash}
                        </p>
                      </div>
                    </div>

                    {certificate.blockchain?.transactionSignature && (
                      <div>
                        <p className="text-[10px] text-[var(--theme-accent)]/60 uppercase tracking-wider mb-1">
                          Transaction Signature
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-[#F0F4F2] font-mono bg-[var(--theme-card)] px-3 py-2 rounded-lg flex-1 truncate">
                            {certificate.blockchain.transactionSignature}
                          </p>
                          <a
                            href={certificate.blockchain.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-[var(--theme-card)] rounded-lg hover:bg-white/10 transition-all"
                          >
                            <ExternalLink size={14} className="text-[var(--theme-accent)]" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Task Info */}
                <div className="bg-[var(--theme-card-alt)] rounded-2xl p-5 border border-white/5">
                  <h4 className="text-sm font-bold text-[#F0F4F2] uppercase tracking-wider mb-3">
                    Task Details
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-[var(--theme-accent)]/60 uppercase tracking-wider">
                        Task
                      </p>
                      <p className="text-sm text-[#F0F4F2]">{certificate.taskTitle}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--theme-accent)]/60 uppercase tracking-wider">
                        Project
                      </p>
                      <p className="text-sm text-[#F0F4F2]">{certificate.projectName}</p>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {mintError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-400 text-sm">{mintError}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {certificate.status === "pending" && (
                    <button
                      onClick={handleMint}
                      disabled={isMinting || !connected}
                      className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 ${
                        connected
                          ? "bg-[var(--theme-accent)] text-[var(--theme-card)] hover:scale-[1.02]"
                          : "bg-[var(--theme-muted)] text-[#F0F4F2]/50 cursor-not-allowed"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isMinting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Minting...
                        </>
                      ) : !connected ? (
                        <>
                          <Lock size={16} />
                          Connect Wallet to Mint
                        </>
                      ) : (
                        <>
                          <Shield size={16} />
                          Mint on Blockchain
                        </>
                      )}
                    </button>
                  )}

                  {certificate.blockchain?.explorerUrl && (
                    <a
                      href={certificate.blockchain.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-4 bg-[var(--theme-muted)] text-[#F0F4F2] rounded-xl font-bold uppercase tracking-wider text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={16} />
                      View on Explorer
                    </a>
                  )}

                  <button
                    onClick={() => {
                      if (!canViewCertificate) {
                        alert("Mint the certificate first to download it!");
                        return;
                      }
                      alert("Download feature coming soon!");
                    }}
                    disabled={!canViewCertificate}
                    className={`px-6 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all border border-white/5 ${
                      canViewCertificate
                        ? "bg-[var(--theme-card-alt)] text-[var(--theme-accent)] hover:bg-white/10"
                        : "bg-[var(--theme-card-alt)]/50 text-[var(--theme-accent)]/30 cursor-not-allowed"
                    }`}
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
