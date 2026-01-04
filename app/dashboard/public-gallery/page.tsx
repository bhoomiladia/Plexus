"use client";

import { useState, useEffect } from "react";
import {
  ExternalLink,
  Github,
  Trophy,
  Calendar,
  Users,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Project {
  _id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  roles: any[];
  githubLink?: string;
  demoLink?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
}

export default function PublicGallery() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedProjects = async () => {
      try {
        const res = await fetch("/api/public-gallery");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error("Error fetching completed projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedProjects();
  }, []);

  if (loading) {
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--theme-accent)]" />
      </div>
    );
  }

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-10"
      >
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-5xl font-black   uppercase text-[#F0F4F2] tracking-tighter flex items-center gap-4">
              <Trophy className="text-[var(--theme-accent)]" size={40} /> Showcase
            </h1>
            <p className="text-[var(--theme-accent)] font-bold tracking-[0.2em] text-[10px] uppercase opacity-60 mt-2">
              Operational Archive // Completed Ventures
            </p>
          </div>
          <div className="bg-[var(--theme-card-alt)] px-8 py-4 rounded-[2rem] border border-white/5 text-center min-w-[140px]">
            <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-50">
              Total Assets
            </p>
            <p className="text-2xl font-black text-[#F0F4F2]">
              {projects.length}
            </p>
          </div>
        </header>

        {/* Project Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-24 bg-[var(--theme-card-alt)]/30 rounded-[3.5rem] border border-dashed border-white/10">
            <Trophy className="mx-auto mb-6 text-[#F0F4F2]/20" size={64} />
            <h3 className="text-2xl font-black   uppercase text-[#F0F4F2]/40 tracking-widest mb-4">
              No Completed Projects Yet
            </h3>
            <p className="text-[var(--theme-accent)]/30 font-bold uppercase tracking-[0.2em] text-[10px] max-w-md mx-auto">
              Completed projects will appear here for the community to explore
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <motion.div
                key={project._id}
                whileHover={{ y: -5, borderColor: "rgba(136, 171, 142, 0.3)" }}
                className="bg-[var(--theme-card-alt)] rounded-[3.5rem] overflow-hidden border border-white/5 transition-all group"
              >
                {/* Card Header with Gradient */}
                <div className="h-44 bg-gradient-to-br from-[var(--theme-muted)] to-[var(--theme-card-alt)] p-8 flex items-end relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                    <Trophy size={80} className="text-[var(--theme-accent)]" />
                  </div>
                  <h2 className="text-2xl font-black   text-[#F0F4F2] uppercase tracking-tighter leading-tight relative z-10">
                    {project.title}
                  </h2>
                </div>

                <div className="p-8 space-y-6">
                  <p className="text-xs font-medium text-[#F0F4F2]/40 leading-relaxed   line-clamp-3">
                    {project.description}
                  </p>

                  {/* Owner Info */}
                  <div className="flex items-center gap-3 py-3 px-4 bg-[var(--theme-card)] rounded-2xl border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-[var(--theme-muted)] flex items-center justify-center text-[var(--theme-accent)] text-xs font-black uppercase">
                      {project.ownerName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-[#F0F4F2] uppercase truncate">
                        {project.ownerName}
                      </p>
                      <p className="text-[9px] text-[var(--theme-accent)]/60 uppercase tracking-wider">
                        Project Lead
                      </p>
                    </div>
                  </div>

                  {/* Links */}
                  {(project.githubLink || project.demoLink) && (
                    <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                      {project.githubLink && (
                        <a
                          href={project.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--theme-accent)] hover:text-[#F0F4F2] transition-colors"
                        >
                          <Github size={16} /> REPO
                        </a>
                      )}
                      {project.demoLink && (
                        <a
                          href={project.demoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--theme-accent)] hover:text-[#F0F4F2] transition-colors"
                        >
                          <ExternalLink size={16} /> DEMO
                        </a>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-[var(--theme-card)] text-[#F0F4F2]/40 px-4 py-2 rounded-xl flex items-center gap-2 border border-white/5">
                      <Users size={12} className="text-[var(--theme-accent)]" />{" "}
                      {project.memberCount} Members
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-[var(--theme-card)] text-[#F0F4F2]/40 px-4 py-2 rounded-xl flex items-center gap-2 border border-white/5">
                      <Calendar size={12} className="text-[var(--theme-accent)]" />{" "}
                      {new Date(project.completedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* View Details Button */}
                  <Link
                    href={`/dashboard/public-gallery/${project._id}`}
                    className="block w-full py-3 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center hover:bg-[var(--theme-accent)] hover:text-[var(--theme-background)] transition-all border border-[var(--theme-accent)]/20"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
