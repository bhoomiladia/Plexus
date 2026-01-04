"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Plus,
  Briefcase,
  Crown,
  Users,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [myProjects, setMyProjects] = useState([]);
  const [openProjects, setOpenProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const [myRes, openRes] = await Promise.all([
          fetch("/api/project/my-projects"),
          fetch("/api/project/all-open"),
        ]);
        const myData = await myRes.json();
        const openData = await openRes.json();

        setMyProjects(myData);
        // Filter out user's own projects from open projects
        const filteredOpen = openData
          .filter((p: any) => p.ownerId !== session?.user?.id)
          .slice(0, 6);
        setOpenProjects(filteredOpen);
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchProjects();
  }, [session]);

  if (loading)
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--theme-accent)]" />
      </div>
    );

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
              Projects Hub
            </h1>
            <p className="text-[var(--theme-accent)] font-bold tracking-[0.2em] text-[10px] uppercase opacity-60 mt-2">
              Manage / Discover / Collaborate
            </p>
          </div>
          <Link
            href="/dashboard/projects/create"
            className="bg-[var(--theme-accent)] text-[var(--theme-background)] px-8 py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2 hover:scale-105 transition-all shadow-xl"
          >
            <Plus size={18} /> New Project
          </Link>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/projects/manage">
            <div className="bg-[var(--theme-muted)] p-8 rounded-[3rem] border border-white/5 hover:border-[var(--theme-accent)]/30 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[var(--theme-card)] rounded-xl">
                  <Crown size={24} className="text-[var(--theme-accent)]" />
                </div>
                <ArrowRight
                  size={20}
                  className="text-[var(--theme-accent)] opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <h3 className="text-2xl font-black   uppercase text-[#F0F4F2] tracking-tighter mb-2">
                My Projects
              </h3>
              <p className="text-[var(--theme-accent)]/60 text-xs font-bold uppercase tracking-wider">
                {myProjects.length} Active
              </p>
            </div>
          </Link>

          <Link href="/dashboard/projects/open">
            <div className="bg-[var(--theme-card-alt)] p-8 rounded-[3rem] border border-white/5 hover:border-[var(--theme-accent)]/30 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[var(--theme-card)] rounded-xl">
                  <Sparkles size={24} className="text-[var(--theme-accent)]" />
                </div>
                <ArrowRight
                  size={20}
                  className="text-[var(--theme-accent)] opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <h3 className="text-2xl font-black   uppercase text-[#F0F4F2] tracking-tighter mb-2">
                Discover
              </h3>
              <p className="text-[var(--theme-accent)]/60 text-xs font-bold uppercase tracking-wider">
                Find Opportunities
              </p>
            </div>
          </Link>

          <Link href="/dashboard/projects/create">
            <div className="bg-[var(--theme-accent)] p-8 rounded-[3rem] border border-white/5 hover:scale-105 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[var(--theme-card)] rounded-xl">
                  <Plus size={24} className="text-[var(--theme-accent)]" />
                </div>
                <ArrowRight
                  size={20}
                  className="text-[var(--theme-card)] opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <h3 className="text-2xl font-black   uppercase text-[var(--theme-card)] tracking-tighter mb-2">
                Create New
              </h3>
              <p className="text-[var(--theme-card)]/60 text-xs font-bold uppercase tracking-wider">
                Start a Venture
              </p>
            </div>
          </Link>
        </div>

        {/* My Projects Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
              My Projects
            </h2>
            <Link
              href="/dashboard/projects/manage"
              className="text-[var(--theme-accent)] text-[10px] font-black uppercase tracking-[0.2em] hover:underline"
            >
              View All →
            </Link>
          </div>

          {myProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProjects.slice(0, 3).map((project: any) => {
                const isOwner = project.ownerId === session?.user?.id;
                return (
                  <Link
                    key={project._id}
                    href={`/dashboard/projects/manage/${project._id}`}
                  >
                    <div className="bg-[var(--theme-card-alt)] p-6 rounded-[2.5rem] border border-white/5 hover:border-[var(--theme-accent)]/30 transition-all group h-full flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-black   text-[#F0F4F2] uppercase tracking-tighter group-hover:text-[var(--theme-accent)] transition-colors line-clamp-1 flex-1">
                          {project.title}
                        </h3>
                        <div className="ml-2 p-2 bg-[var(--theme-card)] rounded-lg">
                          {isOwner ? (
                            <Crown size={14} className="text-[var(--theme-accent)]" />
                          ) : (
                            <Users size={14} className="text-[var(--theme-accent)]/50" />
                          )}
                        </div>
                      </div>
                      <p className="text-[#F0F4F2]/40 text-xs leading-relaxed line-clamp-2 mb-4">
                        {project.description}
                      </p>
                      <div className="mt-auto">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-accent)]/60">
                          {project.status || "OPEN"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center border border-dashed border-white/10 rounded-[3rem] bg-[var(--theme-card-alt)]/30">
              <p className="text-[#F0F4F2]/30 font-bold uppercase tracking-widest text-xs mb-4">
                No projects yet
              </p>
              <Link
                href="/dashboard/projects/create"
                className="inline-block text-[var(--theme-accent)] font-black uppercase tracking-[0.2em] text-[10px] hover:underline"
              >
                Create Your First Project →
              </Link>
            </div>
          )}
        </div>

        {/* Discover Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
              Discover Projects
            </h2>
            <Link
              href="/dashboard/projects/open"
              className="text-[var(--theme-accent)] text-[10px] font-black uppercase tracking-[0.2em] hover:underline"
            >
              View All →
            </Link>
          </div>

          {openProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openProjects.map((project: any) => (
                <Link
                  key={project._id}
                  href={`/dashboard/projects/${project._id}`}
                >
                  <div className="bg-[var(--theme-card-alt)] p-6 rounded-[2.5rem] border border-white/5 hover:border-[var(--theme-accent)]/30 transition-all group h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-[var(--theme-card)] rounded-lg">
                        <Briefcase size={16} className="text-[var(--theme-accent)]" />
                      </div>
                      <span className="bg-[var(--theme-accent)] text-[var(--theme-background)] px-2 py-1 rounded-full text-[8px] font-black uppercase">
                        Open
                      </span>
                    </div>
                    <h3 className="text-xl font-black   text-[#F0F4F2] uppercase tracking-tighter mb-3 group-hover:text-[var(--theme-accent)] transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-[#F0F4F2]/40 text-xs leading-relaxed line-clamp-2 mb-4">
                      {project.description}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-1">
                      {project.roles?.slice(0, 2).map((role: any) => (
                        <span
                          key={role._id}
                          className="px-2 py-1 bg-[var(--theme-card)] text-[var(--theme-accent)]/60 text-[8px] font-black rounded uppercase"
                        >
                          {role.roleName}
                        </span>
                      ))}
                      {project.roles?.length > 2 && (
                        <span className="px-2 py-1 text-[var(--theme-accent)]/40 text-[8px] font-black">
                          +{project.roles.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center border border-dashed border-white/10 rounded-[3rem] bg-[var(--theme-card-alt)]/30">
              <p className="text-[#F0F4F2]/30 font-bold uppercase tracking-widest text-xs">
                No open projects available
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
