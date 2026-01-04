"use client";

import { useSession } from "next-auth/react";
import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Briefcase,
  ArrowRight,
  Sparkles,
  Loader2,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function OpenProjectsPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [userApps, setUserApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, appsRes] = await Promise.all([
          fetch("/api/project/all-open"),
          fetch("/api/project/applications/my-requests"),
        ]);
        const pData = await projectsRes.json();
        const aData = await appsRes.json();
        setProjects(pData);
        setUserApps(aData);
      } catch (error) {
        console.error("Discovery Error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchData();
  }, [session]);

  const filteredProjects = useMemo(() => {
    const userId = session?.user?.id;
    const userSkills =
      session?.user?.skills?.map((s: string) =>
        s.toLowerCase().replace(/[^a-z0-9]/g, "")
      ) || [];

    return projects.filter((project) => {
      const isOwner = project.ownerId === userId;
      const isMember = userApps.some(
        (a) => a.projectId === project._id && a.status === "ACCEPTED"
      );
      if (isOwner || isMember || project.status !== "OPEN") return false;

      const projectSkills = project.roles
        .flatMap((r: any) => [r.roleName, ...(r.mandatorySkills || [])])
        .map((s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ""));

      const hasSkillMatch =
        userSkills.length === 0 ||
        userSkills.some((uSkill: string) =>
          projectSkills.some(
            (pSkill: string) =>
              pSkill.includes(uSkill) || uSkill.includes(pSkill)
          )
        );

      const matchesSearch =
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());

      return hasSkillMatch && matchesSearch;
    });
  }, [session, searchQuery, projects, userApps]);

  if (loading)
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--theme-accent)]" />
      </div>
    );

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 mb-12"
      >
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
              Discover Ventures
            </h1>
            <p className="text-[var(--theme-accent)] font-bold tracking-[0.2em] text-[10px] uppercase opacity-60">
              Protocol Analysis // Network Opportunities
            </p>
          </div>

          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-accent)]/40"
              size={16}
            />
            <input
              type="text"
              placeholder="Search ID or Stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-[var(--theme-card-alt)] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[var(--theme-accent)] transition-all"
            />
          </div>
        </div>
      </motion.header>

      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[var(--theme-card-alt)] p-8 rounded-[3.5rem] border border-white/5 hover:border-[var(--theme-accent)]/30 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-[var(--theme-card)] rounded-2xl border border-white/5 group-hover:bg-[var(--theme-accent)] group-hover:text-[var(--theme-card)] transition-colors">
                    <Briefcase size={24} />
                  </div>
                  <div className="bg-[var(--theme-accent)] text-[var(--theme-background)] px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter flex items-center gap-1">
                    <Sparkles size={10} /> Match
                  </div>
                </div>

                <h3 className="text-2xl font-black   text-[#F0F4F2] uppercase tracking-tighter mb-3 group-hover:text-[var(--theme-accent)] transition-colors">
                  {project.title}
                </h3>
                <p className="text-[#F0F4F2]/40 text-xs leading-relaxed line-clamp-3 mb-8">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {project.roles.map((role: any) => (
                    <span
                      key={role._id}
                      className="px-3 py-1 bg-[var(--theme-card)] text-[var(--theme-accent)]/60 text-[8px] font-black rounded-lg uppercase tracking-widest border border-white/5"
                    >
                      {role.roleName}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                href={`/dashboard/projects/${project._id}`}
                className="flex items-center justify-center w-full py-4 bg-[var(--theme-card)] text-[var(--theme-accent)] border border-white/5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[var(--theme-accent)] hover:text-[var(--theme-background)] transition-all"
              >
                Access Protocol <ArrowRight size={14} className="ml-2" />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-[var(--theme-card-alt)]/30 rounded-[3.5rem] border border-dashed border-white/10">
          <div className="max-w-xs mx-auto space-y-6">
            <p className="text-[#F0F4F2]/30 text-xs font-black uppercase tracking-widest">
              No Signals Detected
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-block text-[var(--theme-accent)] font-black uppercase tracking-[0.2em] text-[10px] hover:underline transition-all"
            >
              Update Identity Profile →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
