"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Trophy,
  Users,
  Code2,
  Calendar,
  Layout,
  Star,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
  isOwner: boolean;
}

interface Project {
  _id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerBio?: string;
  roles: any[];
  githubLink?: string;
  demoLink?: string;
  members: Member[];
  memberCount: number;
  skills: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string;
}

export default function ProjectShowcaseView() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/public-gallery/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data.project);
        } else {
          console.error("Failed to fetch project");
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--theme-accent)]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex flex-col items-center justify-center p-10">
        <Trophy className="text-[#F0F4F2]/20 mb-6" size={80} />
        <h2 className="text-3xl font-black   uppercase text-[#F0F4F2]/40 tracking-widest mb-4">
          Protocol Signal Lost
        </h2>
        <p className="text-[var(--theme-accent)]/30 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">
          Project not found or not completed
        </p>
        <Link
          href="/dashboard/public-gallery"
          className="px-8 py-4 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:scale-105 transition-all"
        >
          Return to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10"
      >
        {/* Navigation */}
        <Link
          href="/dashboard/public-gallery"
          className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-accent)] opacity-60 hover:opacity-100 transition-all"
        >
          <ArrowLeft size={14} /> Back to Archive
        </Link>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-[var(--theme-card-alt)] rounded-[1.5rem] border border-white/5 shadow-xl">
                <Trophy className="text-[var(--theme-accent)]" size={32} />
              </div>
              <h1 className="text-6xl font-black   uppercase text-[#F0F4F2] tracking-tighter leading-none">
                {project.title}
              </h1>
            </div>
            <p className="text-xl text-[#F0F4F2]/70 leading-relaxed  ">
              {project.description}
            </p>
          </div>

          <div className="flex gap-4 w-full lg:w-auto">
            {project.demoLink && (
              <a
                href={project.demoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:scale-105 transition-all shadow-xl"
              >
                <ExternalLink size={18} /> Live Demo
              </a>
            )}
            {project.githubLink && (
              <a
                href={project.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-[var(--theme-card-alt)] text-[#F0F4F2] border border-white/5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-[var(--theme-muted)] transition-all"
              >
                <Github size={18} /> Source
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-10">
          {/* LEFT: Project Depth */}
          <div className="col-span-12 lg:col-span-8 space-y-10">
            {/* Main Visual/Hero Area */}
            <div className="aspect-video bg-[var(--theme-card-alt)] rounded-[4rem] border-8 border-[var(--theme-card)] shadow-2xl flex flex-col items-center justify-center overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-muted)]/20 to-transparent" />
              <Layout
                size={80}
                className="text-[var(--theme-accent)]/20 group-hover:scale-110 transition-transform duration-700"
              />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--theme-accent)]/40 mt-6">
                Secure Visual Asset Preview
              </p>
            </div>

            {/* Tech Stack */}
            {project.skills.length > 0 && (
              <div className="bg-[var(--theme-card-alt)] p-12 rounded-[3.5rem] border border-white/5 space-y-8">
                <h3 className="text-2xl font-black   uppercase text-[#F0F4F2] tracking-tighter flex items-center gap-4">
                  <Code2 className="text-[var(--theme-accent)]" /> Integrated Stack
                </h3>
                <div className="flex flex-wrap gap-3">
                  {project.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-6 py-2.5 bg-[var(--theme-card)] border border-white/5 text-[var(--theme-accent)] rounded-xl font-black uppercase tracking-widest text-[10px]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Stats & Contributors */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-[var(--theme-card-alt)] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-10">
              <h3 className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-[0.3em] flex items-center gap-3 opacity-60">
                <Star size={16} /> Asset Metadata
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between group">
                  <span className="text-[#F0F4F2]/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                    <Calendar size={16} /> Completed
                  </span>
                  <span className="font-black   text-[#F0F4F2] uppercase tracking-tighter text-sm">
                    {new Date(project.completedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between group">
                  <span className="text-[#F0F4F2]/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                    <Users size={16} /> Team Size
                  </span>
                  <span className="font-black   text-[#F0F4F2] uppercase tracking-tighter text-sm">
                    {project.memberCount} Members
                  </span>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <div>
                <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-[0.4em] mb-6 opacity-40 text-center">
                  Core Team
                </p>
                <div className="space-y-4">
                  {project.members.map((member, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-4 bg-[var(--theme-card)] rounded-2xl border border-white/5 hover:border-[var(--theme-accent)]/30 transition-all group"
                    >
                      <div className="w-12 h-12 bg-[var(--theme-muted)] rounded-xl flex items-center justify-center text-[var(--theme-accent)] font-black   text-lg uppercase shadow-xl">
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black   text-[#F0F4F2] uppercase tracking-tight group-hover:text-[var(--theme-accent)] transition-colors truncate">
                          {member.name}
                        </p>
                        <p className="text-[9px] font-black text-[var(--theme-accent)]/50 uppercase tracking-widest">
                          {member.role}
                        </p>
                      </div>
                      {member.isOwner && (
                        <span className="px-2 py-1 bg-[var(--theme-accent)] text-[var(--theme-background)] text-[7px] font-black rounded uppercase">
                          Lead
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-[var(--theme-accent)] p-12 rounded-[3.5rem] text-[var(--theme-background)] shadow-2xl">
              <h4 className="text-2xl font-black   uppercase tracking-tighter mb-4 leading-tight">
                Initiate New <br /> Venture?
              </h4>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-10 leading-relaxed">
                Deploy a fresh project architecture or integrate with existing
                protocols.
              </p>
              <Link
                href="/dashboard/projects/create"
                className="block text-center py-5 bg-[var(--theme-background)] text-[var(--theme-accent)] rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:scale-[1.02] transition-all shadow-xl"
              >
                Deploy Project
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
