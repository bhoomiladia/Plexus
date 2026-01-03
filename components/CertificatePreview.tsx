"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
}

export default function CertificatePreview({
  certificate,
  isOpen,
  onClose,
  onMint,
}: CertificatePreviewProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleMint = async () => {
    if (!onMint) return;
    setIsMinting(true);
    try {
      await onMint();
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
            className="bg-[#1A2323] rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Award className="text-[#88AB8E]" size={24} />
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
                  className="rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    background: "linear-gradient(135deg, #d4e7d4 0%, #f0f4e8 50%, #e8f0e0 100%)",
                  }}
                >
                  <div className="p-8 min-h-[400px] flex flex-col">
                    {/* Logo */}
                    <p className="text-[#1A2323] font-black text-lg">Unirico</p>
                    
                    {/* Title */}
                    <h3 className="text-2xl font-black text-[#1A2323] mt-6 text-center uppercase tracking-wider">
                      Certificate of Contribution
                    </h3>
                    
                    <p className="text-center text-[#3E5C58] mt-4 text-sm">
                      This certificate is proudly awarded to:
                    </p>
                    
                    {/* Name */}
                    <h4 className="text-3xl font-black text-[#1A2323] text-center mt-2 uppercase">
                      {certificate.userName}
                    </h4>
                    
                    <p className="text-center text-[#3E5C58] mt-4 text-sm px-4">
                      In recognition of their significant contributions to the{" "}
                      <span className="font-bold">{certificate.projectName}</span> ecosystem.
                    </p>

                    <div className="mt-auto pt-6 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#3E5C58] text-xs">Awarded on:</p>
                        <p className="text-[#1A2323] font-bold">
                          {formatDate(certificate.issuedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#3E5C58] text-xs">Total Tasks Completed:</p>
                        <p className="text-[#1A2323] font-bold">
                          {certificate.totalTasksCompleted}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#3E5C58] text-xs">Role:</p>
                        <p className="text-[#1A2323] font-bold">{certificate.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#3E5C58] text-xs">Certificate ID:</p>
                        <p className="text-[#1A2323] font-bold text-xs">
                          {certificate.certificateId}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

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
                {/* Blockchain Info */}
                <div className="bg-[#243131] rounded-2xl p-5 border border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="text-[#88AB8E]" size={18} />
                    <h4 className="text-sm font-bold text-[#F0F4F2] uppercase tracking-wider">
                      Blockchain Verification
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-[#88AB8E]/60 uppercase tracking-wider mb-1">
                        Network
                      </p>
                      <p className="text-sm text-[#F0F4F2] font-medium">
                        Solana Devnet
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-[#88AB8E]/60 uppercase tracking-wider mb-1">
                        Certificate Hash
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-[#F0F4F2] font-mono bg-[#1A2323] px-3 py-2 rounded-lg flex-1 truncate">
                          {certificate.certificateHash}
                        </p>
                        <button
                          onClick={() => copyToClipboard(certificate.certificateHash)}
                          className="p-2 bg-[#1A2323] rounded-lg hover:bg-white/10 transition-all"
                        >
                          {copied ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} className="text-[#88AB8E]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {certificate.blockchain?.transactionSignature && (
                      <div>
                        <p className="text-[10px] text-[#88AB8E]/60 uppercase tracking-wider mb-1">
                          Transaction Signature
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-[#F0F4F2] font-mono bg-[#1A2323] px-3 py-2 rounded-lg flex-1 truncate">
                            {certificate.blockchain.transactionSignature}
                          </p>
                          <a
                            href={certificate.blockchain.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-[#1A2323] rounded-lg hover:bg-white/10 transition-all"
                          >
                            <ExternalLink size={14} className="text-[#88AB8E]" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Task Info */}
                <div className="bg-[#243131] rounded-2xl p-5 border border-white/5">
                  <h4 className="text-sm font-bold text-[#F0F4F2] uppercase tracking-wider mb-3">
                    Task Details
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-[#88AB8E]/60 uppercase tracking-wider">
                        Task
                      </p>
                      <p className="text-sm text-[#F0F4F2]">{certificate.taskTitle}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#88AB8E]/60 uppercase tracking-wider">
                        Project
                      </p>
                      <p className="text-sm text-[#F0F4F2]">{certificate.projectName}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {certificate.status === "pending" && onMint && (
                    <button
                      onClick={handleMint}
                      disabled={isMinting}
                      className="flex-1 py-4 bg-[#88AB8E] text-[#1A2323] rounded-xl font-bold uppercase tracking-wider text-sm hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isMinting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Minting...
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
                      className="flex-1 py-4 bg-[#3E5C58] text-[#F0F4F2] rounded-xl font-bold uppercase tracking-wider text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={16} />
                      View on Explorer
                    </a>
                  )}

                  <button
                    onClick={() => {
                      // Download certificate as image (would need html2canvas in production)
                      alert("Download feature coming soon!");
                    }}
                    className="px-6 py-4 bg-[#243131] text-[#88AB8E] rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-white/10 transition-all border border-white/5"
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
