"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BadgeCheck,
  Users,
  Calendar,
  ArrowLeft,
  Send,
  Loader2,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ProjectDetails() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyingRole, setApplyingRole] = useState<string | null>(null);

  const userSkills = session?.user?.skills || [];

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/project/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setProject(data.project);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProject();
  }, [id]);

  const handleApply = async (roleId: string) => {
    setApplyingRole(roleId);
    try {
      const res = await fetch("/api/project/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id, roleId: roleId }),
      });

      if (res.ok) {
        alert("Transmission sent successfully!");
        router.push("/dashboard");
      } else {
        const error = await res.json();
        alert(error.message || "Protocol failure");
      }
    } catch (err) {
      alert("System error");
    } finally {
      setApplyingRole(null);
    }
  };

  if (loading)
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--theme-accent)]" />
      </div>
    );

  if (!project)
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex flex-col items-center justify-center text-center p-10">
        <h1 className="text-4xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
          Venture Not Found
        </h1>
        <p className="text-[var(--theme-accent)] font-bold tracking-[0.2em] text-[10px] uppercase opacity-60 mt-4 mb-8">
          The requested protocol ID is invalid
        </p>
        <Link
          href="/dashboard"
          className="px-8 py-4 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-[2rem] font-black uppercase text-[10px] tracking-widest"
        >
          Return to Base
        </Link>
      </div>
    );

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10"
      >
        {/* Navigation */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-accent)] opacity-60 hover:opacity-100 transition-all"
        >
          <ArrowLeft size={14} /> Back to Communications
        </Link>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Project Header Card */}
            <div className="bg-[var(--theme-card-alt)] p-12 rounded-[3.5rem] border border-white/5">
              <h1 className="text-6xl font-black   uppercase text-[#F0F4F2] tracking-tighter leading-none mb-6">
                {project.title}
              </h1>
              <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-accent)] opacity-60">
                <span className="flex items-center gap-2">
                  <Users size={14} /> ID: {project.ownerId.slice(-6)}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar size={14} /> Initialized:{" "}
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-10 p-8 bg-[var(--theme-card)] rounded-[2.5rem] border border-white/5">
                <h3 className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <Info size={14} /> Operational Briefing
                </h3>
                <p className="text-[#F0F4F2]/80 text-xl font-medium leading-relaxed  ">
                  {project.description}
                </p>
              </div>
            </div>

            {/* Roles Section */}
            <div className="space-y-6">
              <h2 className="text-3xl font-black   uppercase text-[#F0F4F2] tracking-tighter px-4">
                Available Positions
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {project.roles.map((role: any) => {
                  const hasMatch = role.mandatorySkills.some((s: string) =>
                    userSkills.includes(s)
                  );
                  const isFull = role.filled >= role.needed;

                  return (
                    <div
                      key={role._id}
                      className={`p-8 rounded-[3rem] border transition-all ${
                        hasMatch
                          ? "bg-[var(--theme-muted)] border-[var(--theme-accent)]/30"
                          : "bg-[var(--theme-card-alt)] border-white/5 opacity-80"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-2xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
                            {role.roleName}
                          </h3>
                          <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-widest mt-1">
                            {role.filled} / {role.needed} Units Allocated
                          </p>
                        </div>
                        {hasMatch && (
                          <span className="bg-[var(--theme-accent)] text-[var(--theme-background)] text-[9px] font-black px-4 py-2 rounded-full flex items-center gap-2 uppercase tracking-widest">
                            <BadgeCheck size={12} /> Skill Match
                          </span>
                        )}
                      </div>

                      <div className="mb-8">
                        <p className="text-[9px] font-black text-[#F0F4F2]/30 uppercase tracking-[0.2em] mb-4">
                          Required Skillsets
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {role.mandatorySkills.map((s: string) => (
                            <span
                              key={s}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                userSkills.includes(s)
                                  ? "bg-[var(--theme-accent)] text-[var(--theme-background)]"
                                  : "bg-[var(--theme-card)] text-[#F0F4F2]/40"
                              }`}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {!isFull ? (
                        <button
                          onClick={() => handleApply(role._id)}
                          disabled={applyingRole === role._id}
                          className="w-full py-5 bg-[var(--theme-card)] text-[var(--theme-accent)] border border-white/5 font-black uppercase tracking-[0.3em] rounded-[2rem] hover:bg-[var(--theme-accent)] hover:text-[var(--theme-background)] transition-all flex items-center justify-center gap-3 text-[10px]"
                        >
                          {applyingRole === role._id
                            ? "Transmitting..."
                            : "Apply for Protocol"}{" "}
                          <Send size={14} />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-5 bg-white/5 text-[#F0F4F2]/20 font-black uppercase tracking-[0.3em] rounded-[2rem] text-[10px] cursor-not-allowed"
                        >
                          Position Fulfilled
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-[var(--theme-accent)] p-10 rounded-[3.5rem] text-[var(--theme-background)] shadow-2xl">
              <h3 className="text-2xl font-black   uppercase tracking-tighter mb-4 leading-tight">
                Collaboration <br /> Ready
              </h3>
              <p className="text-xs font-bold opacity-70 leading-relaxed uppercase tracking-wider">
                This venture is seeking active contributors. Operators usually
                acknowledge within 24 standard cycles.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
