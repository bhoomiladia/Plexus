"use client";

import type React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import SyntheticHero from "@/components/synthetic-hero";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Plus, Rocket, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    title: "",
    bio: "",
  });

  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg({ type: "", text: "" });

    try {
      const response = await fetch("/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, skills: skills }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatusMsg({
          type: "success",
          text: "Identity verified. Redirecting to console...",
        });
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setStatusMsg({
          type: "error",
          text: result.message || "Protocol Failure",
        });
      }
    } catch (error) {
      setStatusMsg({ type: "error", text: "Uplink Error. Check connection." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--theme-background)] overflow-y-auto no-scrollbar py-10 flex items-center justify-center">
      {/* Background Hero Element */}
      <div className="absolute inset-0 opacity-10 grayscale pointer-events-none">
        <SyntheticHero
          title="IDENTITY ENROLLMENT"
          description="Initialize your specialist profile within the UNIRIVO Network."
          badgeText="Secure Entry"
          badgeLabel="Phase"
          ctaButtons={[]}
          microDetails={[
            "Biometric Sync",
            "Encrypted Identity",
            "Global Access",
          ]}
        />
      </div>

      <div className="relative z-10 w-full max-w-[750px] p-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-[var(--theme-card)] border border-white/5 rounded-[3.5rem] p-8 sm:p-12 shadow-2xl"
        >
          <div className="text-center mb-10">
            <h1 className="text-[#F0F4F2] text-5xl font-black   uppercase tracking-normal leading-none">
              Join Us
            </h1>
            <p className="text-[var(--theme-accent)] font-bold tracking-[0.3em] text-[10px] uppercase opacity-60 mt-4">
              Initialize Specialist Protocol
            </p>
          </div>

          {statusMsg.text && (
            <div
              className={`mb-8 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border ${
                statusMsg.type === "success"
                  ? "bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/20 text-[var(--theme-accent)]"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-[0.2em] ml-2 opacity-60">
                  Full Identity Name
                </label>
                <input
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="h-14 px-6 rounded-[1.5rem] border border-white/5 focus:ring-2 focus:ring-[var(--theme-accent)]/50 outline-none bg-[var(--theme-background)] text-[#F0F4F2] font-bold transition-all placeholder:text-white/5"
                  placeholder="Troye Sivan"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-[0.2em] ml-2 opacity-60">
                  Signal Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="h-14 px-6 rounded-[1.5rem] border border-white/5 focus:ring-2 focus:ring-[var(--theme-accent)]/50 outline-none bg-[var(--theme-background)] text-[#F0F4F2] font-bold transition-all placeholder:text-white/5"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-[0.2em] ml-2 opacity-60">
                  Specialist Title
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="h-14 px-6 rounded-[1.5rem] border border-white/5 focus:ring-2 focus:ring-[var(--theme-accent)]/50 outline-none bg-[var(--theme-background)] text-[#F0F4F2] font-bold transition-all placeholder:text-white/5"
                  placeholder="e.g. Fullstack Developer"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-[0.2em] ml-2 opacity-60">
                  Register Skillsets
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addSkill())
                    }
                    className="flex-1 h-14 px-6 rounded-[1.5rem] border border-white/5 focus:ring-2 focus:ring-[var(--theme-accent)]/50 outline-none bg-[var(--theme-background)] text-[#F0F4F2] font-bold transition-all placeholder:text-white/5"
                    placeholder="React, Figma..."
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-5 bg-[var(--theme-card-alt)] border border-white/5 rounded-2xl hover:bg-[var(--theme-accent)] hover:text-[var(--theme-background)] text-[var(--theme-accent)] transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Skill Tags */}
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 text-[var(--theme-accent)] text-[10px] font-black uppercase tracking-widest rounded-full"
                >
                  {skill}
                  <X
                    size={12}
                    className="cursor-pointer hover:text-white"
                    onClick={() => removeSkill(skill)}
                  />
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-[0.2em] ml-2 opacity-60">
                Operational Briefing (Bio)
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full h-32 p-6 rounded-[2rem] border border-white/5 focus:ring-2 focus:ring-[var(--theme-accent)]/50 outline-none bg-[var(--theme-background)] text-[#F0F4F2] font-medium   transition-all resize-none"
                placeholder="What are you building?"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-[0.2em] ml-2 opacity-60">
                Encryption Key (Password)
              </label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="h-14 px-6 rounded-[1.5rem] border border-white/5 focus:ring-2 focus:ring-[var(--theme-accent)]/50 outline-none bg-[var(--theme-background)] text-[#F0F4F2] font-bold transition-all placeholder:text-white/5"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 bg-[var(--theme-accent)] text-[var(--theme-background)] font-black uppercase tracking-[0.3em] text-xs rounded-[2rem] hover:scale-[1.02] transition-all shadow-xl shadow-[var(--theme-accent)]/10 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Initializing Identity...
                </>
              ) : (
                <>
                  <Rocket size={18} /> Deploy Profile
                </>
              )}
            </button>
          </form>

          <div className="flex flex-col items-center justify-center mt-12 gap-3">
            <p className="text-[#F0F4F2]/20 text-[10px] font-black uppercase tracking-widest">
              Authorized Already?
            </p>
            <Link
              href="/login"
              className="text-[var(--theme-accent)] hover:text-[#F0F4F2] transition-all text-xs font-black uppercase tracking-[0.2em] underline underline-offset-8 decoration-2"
            >
              Sign In Protocol
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
