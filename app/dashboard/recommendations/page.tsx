"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Briefcase,
  ArrowRight,
  Loader2,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Recommendation {
  _id: string;
  title: string;
  description: string;
  ownerId: string;
  roles: any[];
  matchScore: number;
}

export default function RecommendationsPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch("/api/dashboard/recommendations");
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[#1A2323] rounded-[3.5rem] flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-[#88AB8E]" />
      </div>
    );
  }

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[#1A2323] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10"
      >
        {/* Navigation */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#88AB8E] opacity-60 hover:opacity-100 transition-all"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-5xl font-black   uppercase text-[#F0F4F2] tracking-tighter flex items-center gap-4">
              <Sparkles className="text-[#88AB8E]" size={40} /> Recommended
              Projects
            </h1>
            <p className="text-[#88AB8E] font-bold tracking-[0.2em] text-[10px] uppercase opacity-60 mt-2">
              Skill-Matched Opportunities // {recommendations.length} Available
            </p>
          </div>
          <div className="bg-[#243131] px-8 py-4 rounded-[2rem] border border-white/5 text-center min-w-[140px]">
            <p className="text-[9px] font-black text-[#88AB8E] uppercase tracking-widest opacity-50">
              Best Matches
            </p>
            <p className="text-2xl font-black text-[#F0F4F2]">
              {recommendations.filter((r) => r.matchScore > 0).length}
            </p>
          </div>
        </header>

        {/* Recommendations Grid */}
        {recommendations.length === 0 ? (
          <div className="text-center py-24 bg-[#243131]/30 rounded-[3.5rem] border border-dashed border-white/10">
            <Sparkles className="mx-auto mb-6 text-[#F0F4F2]/20" size={64} />
            <h3 className="text-2xl font-black   uppercase text-[#F0F4F2]/40 tracking-widest mb-4">
              No Recommendations Yet
            </h3>
            <p className="text-[#88AB8E]/30 font-bold uppercase tracking-[0.2em] text-[10px] max-w-md mx-auto mb-8">
              Update your skills in settings to get personalized project
              recommendations
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-block px-8 py-4 bg-[#88AB8E] text-[#141C1C] rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:scale-105 transition-all"
            >
              Update Skills
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendations.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#243131] p-8 rounded-[3.5rem] border border-white/5 hover:border-[#88AB8E]/30 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-[#1A2323] rounded-2xl border border-white/5 group-hover:bg-[#88AB8E] group-hover:text-[#1A2323] transition-colors">
                      <Briefcase size={24} />
                    </div>
                    {project.matchScore > 0 ? (
                      <div className="bg-[#88AB8E] text-[#141C1C] px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-tighter flex items-center gap-2">
                        <TrendingUp size={12} /> {project.matchScore}% Match
                      </div>
                    ) : (
                      <div className="bg-white/5 text-[#88AB8E] px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-tighter">
                        New
                      </div>
                    )}
                  </div>

                  <h3 className="text-2xl font-black   text-[#F0F4F2] uppercase tracking-tighter mb-3 group-hover:text-[#88AB8E] transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-[#F0F4F2]/40 text-xs leading-relaxed line-clamp-3 mb-8">
                    {project.description}
                  </p>

                  {project.roles && project.roles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {project.roles
                        .slice(0, 3)
                        .map((role: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-[#1A2323] text-[#88AB8E]/60 text-[8px] font-black rounded-lg uppercase tracking-widest border border-white/5"
                          >
                            {role.roleName}
                          </span>
                        ))}
                      {project.roles.length > 3 && (
                        <span className="px-3 py-1 text-[#88AB8E]/40 text-[8px] font-black">
                          +{project.roles.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    router.push(`/dashboard/projects/${project._id}`)
                  }
                  className="flex items-center justify-center w-full py-4 bg-[#1A2323] text-[#88AB8E] border border-white/5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#88AB8E] hover:text-[#141C1C] transition-all group-hover:scale-105"
                >
                  View Details <ArrowRight size={14} className="ml-2" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Card */}
        {recommendations.length > 0 && (
          <div className="bg-[#3E5C58] p-10 rounded-[3.5rem] text-[#F0F4F2]">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-[#88AB8E] rounded-2xl">
                <Sparkles size={32} className="text-[#141C1C]" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black   uppercase tracking-tighter mb-3">
                  How Recommendations Work
                </h3>
                <p className="text-sm text-[#F0F4F2]/80 leading-relaxed">
                  Projects are matched based on your skills profile. Higher
                  match scores indicate better alignment with your expertise.
                  Update your skills in settings to get more accurate
                  recommendations.
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
