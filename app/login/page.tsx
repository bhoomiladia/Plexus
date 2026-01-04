"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SyntheticHero from "@/components/synthetic-hero";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { signIn } = await import("next-auth/react");
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError("System Sync Failure");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--theme-background)] overflow-hidden flex items-center justify-center">
      {/* Background Hero Element */}
      <div className="absolute inset-0 opacity-20 grayscale pointer-events-none">
        <SyntheticHero
          title="UNIRIVO ARCHIVE"
          description="Operational Intelligence System"
          badgeText="System Active"
          badgeLabel="Status"
          ctaButtons={[]}
          microDetails={["Secure Uplink", "E2E Encrypted", "Auth Protocol V3"]}
        />
      </div>

      <div className="relative z-10 w-full max-w-[500px] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-[var(--theme-card)] border border-white/5 rounded-[3.5rem] p-12 shadow-2xl"
        >
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-[var(--theme-card-alt)] rounded-2xl text-[var(--theme-accent)] mb-6 border border-white/5">
              <ShieldCheck size={40} />
            </div>
            <h1 className="text-6xl font-black   uppercase text-[#F0F4F2] tracking-tighter leading-none mb-2">
              Login
            </h1>
            <p className="text-[var(--theme-accent)] font-bold tracking-[0.3em] text-[10px] uppercase opacity-60">
              Access Operational Console
            </p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest text-center">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-[0.2em] ml-2 opacity-60">
                Identity Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-6 rounded-[1.5rem] border border-white/5 focus:ring-2 focus:ring-[var(--theme-accent)]/50 outline-none bg-[var(--theme-background)] text-[#F0F4F2] font-bold transition-all placeholder:text-white/5"
                placeholder="Email Address"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-[0.2em] ml-2 opacity-60">
                Encryption Key
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-6 rounded-[1.5rem] border border-white/5 focus:ring-2 focus:ring-[var(--theme-accent)]/50 outline-none bg-[var(--theme-background)] text-[#F0F4F2] font-bold transition-all placeholder:text-white/5"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 bg-[var(--theme-accent)] text-[var(--theme-background)] font-black uppercase tracking-[0.3em] text-xs rounded-[2rem] hover:scale-[1.02] transition-all mt-4 shadow-xl shadow-[var(--theme-accent)]/10 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Syncing...
                </>
              ) : (
                "Authorize Session"
              )}
            </button>
          </form>

          <div className="flex flex-col items-center justify-center mt-10 gap-3">
            <p className="text-[#F0F4F2]/20 text-[10px] font-black uppercase tracking-widest">
              Awaiting Identity?
            </p>
            <Link
              href="/signup"
              className="text-[var(--theme-accent)] hover:text-[#F0F4F2] transition-all text-xs font-black uppercase tracking-[0.2em] underline underline-offset-8 decoration-2"
            >
              Request Access
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
