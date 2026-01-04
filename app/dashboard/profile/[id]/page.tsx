"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Github,
  Linkedin,
  Globe,
  Loader2,
  Code,
  Trophy,
  FolderKanban,
} from "lucide-react";
import { motion } from "framer-motion";

interface UserProfile {
  _id: string;
  name: string;
  fullName?: string;
  email: string;
  bio?: string;
  location?: string;
  avatar?: string;
  readme?: string;
  techStack: string[];
  experience?: Array<{
    id?: string;
    title: string;
    company: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
  }>;
  education?: Array<{
    id?: string;
    degree: string;
    school?: string;
    institution?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    year?: string;
    description?: string;
  }>;
  links?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    twitter?: string;
  };
  stats: {
    projectsOwned: number;
    projectsJoined: number;
    projectsCompleted: number;
  };
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          setError("User not found");
        }
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--theme-accent)]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex flex-col items-center justify-center">
        <User className="h-16 w-16 text-[#F0F4F2]/20 mb-4" />
        <h2 className="text-2xl font-black text-[#F0F4F2]/40 uppercase tracking-widest mb-4">
          {error || "User Not Found"}
        </h2>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-[var(--theme-accent)] text-[var(--theme-card)] rounded-2xl font-black uppercase text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-accent)] opacity-60 hover:opacity-100 transition-all"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Profile Header */}
        <div className="bg-[var(--theme-card-alt)] p-10 rounded-[3rem] border border-white/5">
          <div className="flex items-start gap-8">
            <div className="w-28 h-28 rounded-[2rem] bg-[var(--theme-muted)] flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={48} className="text-[var(--theme-accent)]" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-black uppercase text-[#F0F4F2] tracking-tighter mb-2">
                {profile.name}
              </h1>
              {profile.location && (
                <p className="flex items-center gap-2 text-[var(--theme-accent)] text-sm mb-4">
                  <MapPin size={14} /> {profile.location}
                </p>
              )}
              {profile.bio && (
                <p className="text-[#F0F4F2]/60 text-sm leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Social Links */}
          {profile.links && (
            <div className="flex gap-4 mt-8 pt-8 border-t border-white/5">
              {profile.links.github && (
                <a
                  href={profile.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[var(--theme-card)] rounded-xl text-[var(--theme-accent)] hover:bg-[var(--theme-muted)] transition-colors"
                >
                  <Github size={20} />
                </a>
              )}
              {profile.links.linkedin && (
                <a
                  href={profile.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[var(--theme-card)] rounded-xl text-[var(--theme-accent)] hover:bg-[var(--theme-muted)] transition-colors"
                >
                  <Linkedin size={20} />
                </a>
              )}
              {profile.links.portfolio && (
                <a
                  href={profile.links.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[var(--theme-card)] rounded-xl text-[var(--theme-accent)] hover:bg-[var(--theme-muted)] transition-colors"
                >
                  <Globe size={20} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-[var(--theme-card-alt)] p-8 rounded-[2rem] border border-white/5 text-center">
            <FolderKanban className="mx-auto mb-3 text-[var(--theme-accent)]" size={24} />
            <p className="text-3xl font-black text-[#F0F4F2]">{profile.stats.projectsOwned}</p>
            <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-60">
              Projects Created
            </p>
          </div>
          <div className="bg-[var(--theme-card-alt)] p-8 rounded-[2rem] border border-white/5 text-center">
            <Briefcase className="mx-auto mb-3 text-[var(--theme-accent)]" size={24} />
            <p className="text-3xl font-black text-[#F0F4F2]">{profile.stats.projectsJoined}</p>
            <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-60">
              Projects Joined
            </p>
          </div>
          <div className="bg-[var(--theme-card-alt)] p-8 rounded-[2rem] border border-white/5 text-center">
            <Trophy className="mx-auto mb-3 text-[var(--theme-accent)]" size={24} />
            <p className="text-3xl font-black text-[#F0F4F2]">{profile.stats.projectsCompleted}</p>
            <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-60">
              Completed
            </p>
          </div>
        </div>

        {/* Skills */}
        {profile.techStack.length > 0 && (
          <div className="bg-[var(--theme-card-alt)] p-8 rounded-[2rem] border border-white/5">
            <h3 className="flex items-center gap-3 text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-6 opacity-60">
              <Code size={16} /> Skills & Technologies
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.techStack.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-[var(--theme-card)] text-[var(--theme-accent)] text-sm font-bold rounded-xl border border-white/5"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* About Me / README */}
        {profile.readme && (
          <div className="bg-[var(--theme-card-alt)] p-8 rounded-[2rem] border border-white/5">
            <h3 className="flex items-center gap-3 text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-6 opacity-60">
              <User size={16} /> About Me
            </h3>
            <div className="bg-[var(--theme-card)] p-6 rounded-xl border border-white/5">
              <p className="text-[#F0F4F2]/70 text-sm leading-relaxed whitespace-pre-wrap">
                {profile.readme}
              </p>
            </div>
          </div>
        )}

        {/* Experience */}
        {profile.experience && profile.experience.length > 0 && (
          <div className="bg-[var(--theme-card-alt)] p-8 rounded-[2rem] border border-white/5">
            <h3 className="flex items-center gap-3 text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-6 opacity-60">
              <Briefcase size={16} /> Experience
            </h3>
            <div className="space-y-4">
              {profile.experience.map((exp, idx) => (
                <div key={exp.id || idx} className="p-4 bg-[var(--theme-card)] rounded-xl border border-white/5">
                  <p className="font-black text-[#F0F4F2]">{exp.title}</p>
                  <p className="text-[var(--theme-accent)] text-sm">{exp.company} {exp.location && `• ${exp.location}`}</p>
                  <p className="text-[#F0F4F2]/40 text-xs mt-1">
                    {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                  </p>
                  {exp.description && (
                    <p className="text-[#F0F4F2]/60 text-xs mt-2">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {profile.education && profile.education.length > 0 && (
          <div className="bg-[var(--theme-card-alt)] p-8 rounded-[2rem] border border-white/5">
            <h3 className="flex items-center gap-3 text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-6 opacity-60">
              <GraduationCap size={16} /> Education
            </h3>
            <div className="space-y-4">
              {profile.education.map((edu, idx) => (
                <div key={edu.id || idx} className="p-4 bg-[var(--theme-card)] rounded-xl border border-white/5">
                  <p className="font-black text-[#F0F4F2]">{edu.degree}</p>
                  <p className="text-[var(--theme-accent)] text-sm">
                    {edu.school || edu.institution} {edu.field && `• ${edu.field}`}
                  </p>
                  <p className="text-[#F0F4F2]/40 text-xs mt-1">
                    {edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : edu.year}
                  </p>
                  {edu.description && (
                    <p className="text-[#F0F4F2]/60 text-xs mt-2">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
