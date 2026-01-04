"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Award,
  Shield,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Wallet,
} from "lucide-react";
import CertificatePreview from "@/components/CertificatePreview";
import WalletConnectButton from "@/components/WalletConnectButton";
import { useCertificateMint } from "@/hooks/useCertificateMint";

interface Certificate {
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

export default function CertificatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { mintCertificate, isMinting, isWalletConnected, walletAddress } = useCertificateMint();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await fetch("/api/certificates");
        if (res.ok) {
          const data = await res.json();
          setCertificates(data.certificates || []);
        }
      } catch (error) {
        console.error("Error fetching certificates:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchCertificates();
  }, [session]);

  const handleMintCertificate = async (certificateId: string) => {
    const result = await mintCertificate(certificateId);
    
    if (result.success) {
      // Update certificate in state
      setCertificates((prev) =>
        prev.map((cert) =>
          cert._id === certificateId
            ? { 
                ...cert, 
                status: "minted" as const, 
                blockchain: {
                  network: "solana-devnet",
                  transactionSignature: result.transactionSignature,
                  explorerUrl: result.explorerUrl,
                }
              }
            : cert
        )
      );
      // Update selected certificate if open
      if (selectedCertificate?._id === certificateId) {
        setSelectedCertificate((prev) =>
          prev ? { 
            ...prev, 
            status: "minted" as const, 
            blockchain: {
              network: "solana-devnet",
              transactionSignature: result.transactionSignature,
              explorerUrl: result.explorerUrl,
            }
          } : null
        );
      }
    } else {
      alert(result.error || "Failed to mint certificate");
    }
  };

  const filteredCertificates = certificates.filter(
    (cert) =>
      cert.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificateId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1E2B2A]">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--theme-accent)]" />
      </div>
    );
  }

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 min-h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3rem] p-10 overflow-y-auto no-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[var(--theme-accent)] rounded-2xl flex items-center justify-center">
              <Award size={28} className="text-[var(--theme-card)]" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#F0F4F2] uppercase tracking-tight">
                My Certificates
              </h1>
              <p className="text-sm text-[var(--theme-accent)]/60">
                Blockchain-verified achievements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Wallet Connect Button */}
            <WalletConnectButton showBalance={true} />
            
            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-accent)]/40"
              />
              <input
                type="text"
                placeholder="Search certificates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[var(--theme-card-alt)] border border-white/5 pl-10 pr-4 py-3 rounded-xl text-[#F0F4F2] text-sm outline-none focus:ring-2 focus:ring-[var(--theme-accent)] w-64"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[var(--theme-card-alt)] rounded-2xl p-6 border border-white/5">
            <p className="text-[10px] text-[var(--theme-accent)]/60 uppercase tracking-widest">
              Total Certificates
            </p>
            <p className="text-3xl font-black text-[#F0F4F2] mt-2">
              {certificates.length}
            </p>
          </div>
          <div className="bg-[var(--theme-card-alt)] rounded-2xl p-6 border border-white/5">
            <p className="text-[10px] text-[var(--theme-accent)]/60 uppercase tracking-widest">
              On-Chain
            </p>
            <p className="text-3xl font-black text-[var(--theme-accent)] mt-2">
              {certificates.filter((c) => c.status === "minted").length}
            </p>
          </div>
          <div className="bg-[var(--theme-card-alt)] rounded-2xl p-6 border border-white/5">
            <p className="text-[10px] text-[var(--theme-accent)]/60 uppercase tracking-widest">
              Pending
            </p>
            <p className="text-3xl font-black text-yellow-400 mt-2">
              {certificates.filter((c) => c.status === "pending").length}
            </p>
          </div>
        </div>

        {/* Certificates Grid */}
        {filteredCertificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCertificates.map((cert) => (
              <motion.div
                key={cert._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[var(--theme-card-alt)] rounded-2xl p-5 border border-white/5 hover:border-[var(--theme-accent)]/30 transition-all cursor-pointer group"
                onClick={() => setSelectedCertificate(cert)}
              >
                {/* Certificate Mini Preview */}
                <div
                  className="rounded-xl overflow-hidden mb-4 h-32 relative"
                  style={{
                    background:
                      "linear-gradient(135deg, #d4e7d4 0%, #f0f4e8 50%, #e8f0e0 100%)",
                  }}
                >
                  <div className="p-4 h-full flex flex-col justify-center items-center">
                    <p className="text-[8px] text-[var(--theme-muted)] uppercase tracking-wider">
                      Certificate of Contribution
                    </p>
                    <p className="text-sm font-black text-[var(--theme-card)] mt-1 text-center line-clamp-1">
                      {cert.userName}
                    </p>
                    <p className="text-[8px] text-[var(--theme-muted)] mt-1">
                      {cert.projectName}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[8px] font-bold uppercase flex items-center gap-1 ${
                      cert.status === "minted"
                        ? "bg-green-500/20 text-green-600"
                        : cert.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-600"
                          : "bg-red-500/20 text-red-600"
                    }`}
                  >
                    {cert.status === "minted" && <CheckCircle size={8} />}
                    {cert.status === "pending" && <Clock size={8} />}
                    {cert.status === "failed" && <AlertCircle size={8} />}
                    {cert.status}
                  </div>
                </div>

                {/* Certificate Info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#F0F4F2] line-clamp-1">
                    {cert.taskTitle}
                  </h3>
                  <p className="text-xs text-[var(--theme-accent)]/60">{cert.projectName}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <p className="text-[10px] text-[var(--theme-accent)]/40">
                      {formatDate(cert.issuedAt)}
                    </p>
                    {cert.blockchain?.explorerUrl && (
                      <a
                        href={cert.blockchain.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[var(--theme-accent)] hover:text-[#F0F4F2] transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-[var(--theme-accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--theme-card-alt)] rounded-2xl p-12 border border-white/5 text-center">
            <Shield className="mx-auto mb-4 text-[var(--theme-accent)]/30" size={48} />
            <h3 className="text-lg font-bold text-[#F0F4F2] mb-2">
              No Certificates Yet
            </h3>
            <p className="text-sm text-[var(--theme-accent)]/60 max-w-md mx-auto">
              Complete tasks to earn blockchain-verified certificates. Each
              completed task can be minted as an NFT on Solana.
            </p>
            <button
              onClick={() => router.push("/dashboard/tasks")}
              className="mt-6 px-6 py-3 bg-[var(--theme-accent)] text-[var(--theme-card)] rounded-xl font-bold uppercase tracking-wider text-sm hover:scale-[1.02] transition-all"
            >
              View Tasks
            </button>
          </div>
        )}
      </motion.div>

      {/* Certificate Preview Modal */}
      {selectedCertificate && (
        <CertificatePreview
          certificate={selectedCertificate}
          isOpen={!!selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
          onMint={
            selectedCertificate.status === "pending"
              ? () => handleMintCertificate(selectedCertificate._id)
              : undefined
          }
        />
      )}
    </div>
  );
}
