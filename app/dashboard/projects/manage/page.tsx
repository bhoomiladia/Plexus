"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, ArrowRight, Crown, Users, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function MyProjects() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyProjects = async () => {
      try {
        const res = await fetch("/api/project/my-projects");
        const data = await res.json();
        setProjects(data);
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchMyProjects();
  }, [session]);

  if (loading)
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[#1A2323] rounded-[3.5rem] flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-[#88AB8E]" />
      </div>
    );

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[#1A2323] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10"
      >
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
              My Projects
            </h1>
            <p className="text-[#88AB8E] font-bold tracking-[0.2em] text-[10px] uppercase opacity-60 mt-2">
              Management / Collaboration Hub
            </p>
          </div>
          <Link
            href="/dashboard/projects/create"
            className="bg-[#88AB8E] text-[#141C1C] px-8 py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2 hover:scale-105 transition-all shadow-xl"
          >
            <Plus size={18} /> New Venture
          </Link>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.length === 0 ? (
            <div className="col-span-full p-24 text-center border border-dashed border-white/10 rounded-[3.5rem] bg-[#243131]/30">
              <p className="text-[#F0F4F2]/30 font-bold uppercase tracking-widest text-xs">
                No active ventures found. Start something new.
              </p>
            </div>
          ) : (
            projects.map((project: any) => {
              const isOwner = project.ownerId === session?.user?.id;
              return (
                <Link
                  key={project._id}
                  href={`/dashboard/projects/manage/${project._id}`}
                >
                  <div className="bg-[#243131] p-8 rounded-[3.5rem] border border-white/5 hover:border-[#88AB8E]/30 transition-all group relative overflow-hidden h-full flex flex-col">
                    {/* Subtle Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#88AB8E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-black   text-[#F0F4F2] uppercase tracking-tighter group-hover:text-[#88AB8E] transition-colors line-clamp-1">
                            {project.title}
                          </h3>
                        </div>
                        <div className="ml-4 p-2 bg-[#1A2323] rounded-xl border border-white/5">
                          {isOwner ? (
                            <Crown size={16} className="text-[#88AB8E]" />
                          ) : (
                            <Users size={16} className="text-[#88AB8E]/50" />
                          )}
                        </div>
                      </div>

                      <p className="text-[#F0F4F2]/40 text-xs font-medium leading-relaxed line-clamp-3 mb-8">
                        {project.description}
                      </p>

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#88AB8E]/40 mb-1">
                            Status
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#F0F4F2]">
                            {project.status || "Active"}
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#1A2323] flex items-center justify-center text-[#88AB8E] group-hover:bg-[#88AB8E] group-hover:text-[#1A2323] transition-all">
                          <ArrowRight size={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
