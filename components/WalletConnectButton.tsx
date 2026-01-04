"use client";

import { FC, useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Wallet, LogOut, Copy, Check, ExternalLink, Loader2 } from "lucide-react";

interface WalletConnectButtonProps {
  className?: string;
  showBalance?: boolean;
  compact?: boolean;
}

export const WalletConnectButton: FC<WalletConnectButtonProps> = ({
  className = "",
  showBalance = true,
  compact = false,
}) => {
  const { publicKey, connected, disconnect, connecting } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey && connection) {
        try {
          const bal = await connection.getBalance(publicKey);
          setBalance(bal / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error("Error fetching balance:", error);
          setBalance(null);
        }
      } else {
        setBalance(null);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  const handleConnect = () => {
    setVisible(true);
  };

  const handleDisconnect = async () => {
    await disconnect();
    setIsDropdownOpen(false);
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (connecting) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2.5 bg-[var(--theme-card-alt)] text-[var(--theme-accent)] rounded-xl font-medium ${className}`}
      >
        <Loader2 size={16} className="animate-spin" />
        Connecting...
      </button>
    );
  }

  if (!connected || !publicKey) {
    return (
      <button
        onClick={handleConnect}
        className={`flex items-center gap-2 px-4 py-2.5 bg-[var(--theme-accent)] text-[var(--theme-card)] rounded-xl font-bold hover:scale-[1.02] transition-all ${className}`}
      >
        <Wallet size={16} />
        {compact ? "Connect" : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 bg-[var(--theme-card-alt)] text-[#F0F4F2] rounded-xl font-medium border border-white/10 hover:bg-white/5 transition-all ${className}`}
      >
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="font-mono text-sm">{truncateAddress(publicKey.toBase58())}</span>
        {showBalance && balance !== null && (
          <span className="text-[var(--theme-accent)] text-sm ml-1">
            {balance.toFixed(2)} SOL
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--theme-card)] rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <p className="text-[10px] text-[var(--theme-accent)]/60 uppercase tracking-wider mb-1">
                Connected Wallet
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-[#F0F4F2] font-mono flex-1 truncate">
                  {publicKey.toBase58()}
                </p>
                <button
                  onClick={copyAddress}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                >
                  {copied ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} className="text-[var(--theme-accent)]" />
                  )}
                </button>
              </div>
              {balance !== null && (
                <p className="text-lg font-bold text-[#F0F4F2] mt-2">
                  {balance.toFixed(4)} SOL
                </p>
              )}
            </div>

            <div className="p-2">
              <a
                href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#F0F4F2] hover:bg-white/5 rounded-lg transition-all"
              >
                <ExternalLink size={14} className="text-[var(--theme-accent)]" />
                View on Explorer
              </a>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <LogOut size={14} />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WalletConnectButton;
