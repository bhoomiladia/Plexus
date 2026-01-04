"use client";

import { useEffect, useState } from "react";
import {
  Pencil,
  MapPin,
  Plus,
  X,
  Loader2,
  Save,
  Briefcase,
  GraduationCap,
  Award,
  Calendar,
  Building,
  CheckCircle,
  Globe,
  Github,
  Linkedin,
  Twitter,
  ExternalLink,
  TrendingUp,
  FolderOpen,
  Users,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SkillQuizModal from "@/components/SkillQuizModal";

type Links = {
  github?: string;
  linkedin?: string;
  twitter?: string;
  portfolio?: string;
  stackoverflow?: string;
};

type Experience = {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

type Education = {
  id: string;
  degree: string;
  school: string;
  field: string;
  startDate: string;
  endDate: string;
  description: string;
};

type Stats = {
  projectsOwned: number;
  projectsJoined: number;
  projectsCompleted: number;
  profileCompleteness: number;
};

type Profile = {
  name?: string;
  username?: string;
  email?: string;
  bio?: string;
  location?: string;
  techStack: string[];
  readme?: string;
  links: Links;
  avatar?: string;
  experience: Experience[];
  education: Education[];
  achievements: string[];
  availability?: string;
  stats: Stats;
};

const defaultLinks: Links = {
  github: "",
  linkedin: "",
  twitter: "",
  portfolio: "",
  stackoverflow: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit states
  const [editingBio, setEditingBio] = useState(false);
  const [editingStack, setEditingStack] = useState(false);
  const [editingReadme, setEditingReadme] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [editingName, setEditingName] = useState(false);

  // Modal states
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);

  // Form states
  const [newTech, setNewTech] = useState("");
  const [newExperience, setNewExperience] = useState<Partial<Experience>>({});
  const [newEducation, setNewEducation] = useState<Partial<Education>>({});
  const [editingExperience, setEditingExperience] = useState<Experience | null>(
    null
  );
  const [editingEducation, setEditingEducation] = useState<Education | null>(
    null
  );

  // Skill Quiz states
  const [showSkillQuiz, setShowSkillQuiz] = useState(false);
  const [pendingSkill, setPendingSkill] = useState("");

  const normalizeUrl = (url?: string) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;
  };

  const extractUsername = (url: string) => {
    try {
      const cleaned = url
        .replace("https://", "")
        .replace("http://", "")
        .replace("www.", "");
      return cleaned.split("/")[1] || "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        setProfile({
          name: data.name ?? "",
          username: data.username ?? "",
          email: data.email ?? "",
          bio: data.bio ?? "",
          location: data.location ?? "",
          readme: data.readme ?? "",
          techStack: Array.isArray(data.techStack) ? data.techStack : [],
          links: { ...defaultLinks, ...data.links },
          avatar: data.avatar ?? "",
          experience: data.experience ?? [],
          education: data.education ?? [],
          achievements: data.achievements ?? [],
          availability: data.availability ?? "available",
          stats: data.stats ?? {
            projectsOwned: 0,
            projectsJoined: 0,
            projectsCompleted: 0,
            profileCompleteness: 0,
          },
        });
      } catch (e) {
        console.error("Error loading profile:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const patchProfile = async (updates: Partial<Profile>) => {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const res = await fetch("/api/profile");
      const fresh = await res.json();
      setProfile({
        name: fresh.name ?? "",
        username: fresh.username ?? "",
        email: fresh.email ?? "",
        bio: fresh.bio ?? "",
        location: fresh.location ?? "",
        readme: fresh.readme ?? "",
        techStack: Array.isArray(fresh.techStack) ? fresh.techStack : [],
        links: { ...defaultLinks, ...fresh.links },
        avatar: fresh.avatar ?? "",
        experience: fresh.experience ?? [],
        education: fresh.education ?? [],
        achievements: fresh.achievements ?? [],
        availability: fresh.availability ?? "available",
        stats: fresh.stats ?? {
          projectsOwned: 0,
          projectsJoined: 0,
          projectsCompleted: 0,
          profileCompleteness: 0,
        },
      });
    } catch (e) {
      console.error("Error updating profile:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddExperience = async () => {
    if (!newExperience.title || !newExperience.company) return;
    const exp: Experience = {
      id: Date.now().toString(),
      title: newExperience.title || "",
      company: newExperience.company || "",
      location: newExperience.location || "",
      startDate: newExperience.startDate || "",
      endDate: newExperience.endDate || "",
      current: newExperience.current || false,
      description: newExperience.description || "",
    };
    await patchProfile({ experience: [...(profile?.experience || []), exp] });
    setNewExperience({});
    setShowExperienceModal(false);
  };

  const handleUpdateExperience = async () => {
    if (!editingExperience) return;
    const updated =
      profile?.experience.map((e) =>
        e.id === editingExperience.id ? editingExperience : e
      ) || [];
    await patchProfile({ experience: updated });
    setEditingExperience(null);
    setShowExperienceModal(false);
  };

  const handleDeleteExperience = async (id: string) => {
    const updated = profile?.experience.filter((e) => e.id !== id) || [];
    await patchProfile({ experience: updated });
  };

  const handleAddEducation = async () => {
    if (!newEducation.degree || !newEducation.school) return;
    const edu: Education = {
      id: Date.now().toString(),
      degree: newEducation.degree || "",
      school: newEducation.school || "",
      field: newEducation.field || "",
      startDate: newEducation.startDate || "",
      endDate: newEducation.endDate || "",
      description: newEducation.description || "",
    };
    await patchProfile({ education: [...(profile?.education || []), edu] });
    setNewEducation({});
    setShowEducationModal(false);
  };

  const handleUpdateEducation = async () => {
    if (!editingEducation) return;
    const updated =
      profile?.education.map((e) =>
        e.id === editingEducation.id ? editingEducation : e
      ) || [];
    await patchProfile({ education: updated });
    setEditingEducation(null);
    setShowEducationModal(false);
  };

  const handleDeleteEducation = async (id: string) => {
    const updated = profile?.education.filter((e) => e.id !== id) || [];
    await patchProfile({ education: updated });
  };

  // Skill Quiz handlers
  const handleAddSkillClick = () => {
    if (newTech.trim()) {
      // Check if skill already exists
      if (profile?.techStack.includes(newTech.trim())) {
        setNewTech("");
        return;
      }
      setPendingSkill(newTech.trim());
      setShowSkillQuiz(true);
    }
  };

  const handleSkillQuizSuccess = async (skill: string) => {
    await patchProfile({
      techStack: [...(profile?.techStack || []), skill],
    });
    setNewTech("");
    setPendingSkill("");
    setShowSkillQuiz(false);
  };

  const handleSkillQuizClose = () => {
    setShowSkillQuiz(false);
    setPendingSkill("");
  };

  if (loading || !profile)
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--theme-accent)]" />
      </div>
    );

  const avatarLetter =
    profile.name?.charAt(0) || profile.username?.charAt(0) || "?";

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 min-h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Profile Completeness Bar */}
        <div className="bg-[var(--theme-card-alt)] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest">
              Profile Completeness
            </span>
            <span className="text-sm font-black text-[#F0F4F2]">
              {profile.stats.profileCompleteness}%
            </span>
          </div>
          <div className="h-2 bg-[var(--theme-card)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${profile.stats.profileCompleteness}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-muted)] rounded-full"
            />
          </div>
        </div>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row gap-8 bg-[var(--theme-card-alt)] border border-white/5 rounded-[3.5rem] p-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-[var(--theme-accent)] to-transparent" />

          {/* Avatar */}
          <div className="relative z-10 w-28 h-28 rounded-[2rem] bg-[var(--theme-muted)] flex items-center justify-center text-4xl font-black   text-[var(--theme-accent)] border border-white/10 shadow-2xl">
            {avatarLetter}
          </div>

          {/* Info */}
          <div className="relative z-10 flex-1 space-y-3">
            <div className="group">
              {!editingName ? (
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
                    {profile.name || "Your Name"}
                  </h1>
                  <Pencil
                    size={14}
                    className="text-[var(--theme-accent)] opacity-0 group-hover:opacity-100 cursor-pointer"
                    onClick={() => setEditingName(true)}
                  />
                </div>
              ) : (
                <input
                  className="bg-[var(--theme-card)] border border-[var(--theme-accent)]/30 px-4 py-2 rounded-xl text-[#F0F4F2] text-3xl font-black outline-none"
                  value={profile.name}
                  autoFocus
                  onBlur={() => {
                    setEditingName(false);
                    patchProfile({ name: profile.name });
                  }}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                />
              )}
              <p className="text-[var(--theme-accent)] font-bold tracking-[0.2em] text-[10px] uppercase opacity-60 mt-1">
                @{profile.username} • {profile.email}
              </p>
            </div>

            {/* Bio */}
            <div className="group relative max-w-2xl">
              {!editingBio ? (
                <div className="flex items-start gap-3">
                  <p className="text-[#F0F4F2]/70 text-sm font-medium leading-relaxed">
                    {profile.bio ||
                      "Add a bio to tell others about yourself..."}
                  </p>
                  <Pencil
                    size={12}
                    className="text-[var(--theme-accent)] opacity-0 group-hover:opacity-100 cursor-pointer flex-shrink-0"
                    onClick={() => setEditingBio(true)}
                  />
                </div>
              ) : (
                <textarea
                  className="bg-[var(--theme-card)] border border-[var(--theme-accent)]/30 p-4 w-full rounded-2xl text-[#F0F4F2] outline-none text-sm min-h-[80px]"
                  value={profile.bio}
                  autoFocus
                  onBlur={() => {
                    setEditingBio(false);
                    patchProfile({ bio: profile.bio });
                  }}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                />
              )}
            </div>

            {/* Location */}
            <div className="group flex items-center gap-2">
              <MapPin size={14} className="text-[var(--theme-accent)]/50" />
              {!editingLocation ? (
                <>
                  <span className="text-[var(--theme-accent)]/50 text-xs font-bold">
                    {profile.location || "Add location"}
                  </span>
                  <Pencil
                    size={10}
                    className="text-[var(--theme-accent)] opacity-0 group-hover:opacity-100 cursor-pointer"
                    onClick={() => setEditingLocation(true)}
                  />
                </>
              ) : (
                <input
                  className="bg-[var(--theme-card)] border border-[var(--theme-accent)]/30 px-3 py-1 rounded-lg text-[#F0F4F2] text-xs outline-none"
                  value={profile.location}
                  autoFocus
                  onBlur={() => {
                    setEditingLocation(false);
                    patchProfile({ location: profile.location });
                  }}
                  onChange={(e) =>
                    setProfile({ ...profile, location: e.target.value })
                  }
                />
              )}
            </div>
          </div>

          {/* Actions & Social */}
          <div className="relative z-10 flex flex-col items-end gap-4">
            <button
              onClick={() => setShowLinksModal(true)}
              className="bg-[var(--theme-accent)] text-[var(--theme-background)] px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all"
            >
              Edit Links
            </button>
            <div className="flex gap-2">
              {profile.links.github && (
                <a
                  href={normalizeUrl(profile.links.github)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 bg-[var(--theme-card)] border border-white/5 rounded-xl flex items-center justify-center text-[var(--theme-accent)] hover:bg-[var(--theme-accent)] hover:text-[var(--theme-background)] transition-all"
                >
                  <Github size={16} />
                </a>
              )}
              {profile.links.linkedin && (
                <a
                  href={normalizeUrl(profile.links.linkedin)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 bg-[var(--theme-card)] border border-white/5 rounded-xl flex items-center justify-center text-[var(--theme-accent)] hover:bg-[var(--theme-accent)] hover:text-[var(--theme-background)] transition-all"
                >
                  <Linkedin size={16} />
                </a>
              )}
              {profile.links.twitter && (
                <a
                  href={normalizeUrl(profile.links.twitter)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 bg-[var(--theme-card)] border border-white/5 rounded-xl flex items-center justify-center text-[var(--theme-accent)] hover:bg-[var(--theme-accent)] hover:text-[var(--theme-background)] transition-all"
                >
                  <Twitter size={16} />
                </a>
              )}
              {profile.links.portfolio && (
                <a
                  href={normalizeUrl(profile.links.portfolio)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 bg-[var(--theme-card)] border border-white/5 rounded-xl flex items-center justify-center text-[var(--theme-accent)] hover:bg-[var(--theme-accent)] hover:text-[var(--theme-background)] transition-all"
                >
                  <Globe size={16} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[var(--theme-accent)] p-6 rounded-[2rem] text-center">
            <FolderOpen className="mx-auto mb-2 text-[var(--theme-card)]" size={24} />
            <p className="text-3xl font-black text-[var(--theme-card)]">
              {profile.stats.projectsOwned}
            </p>
            <p className="text-[9px] font-black text-[var(--theme-card)]/60 uppercase tracking-widest">
              Projects Created
            </p>
          </div>
          <div className="bg-[var(--theme-card-alt)] p-6 rounded-[2rem] text-center border border-white/5">
            <Users className="mx-auto mb-2 text-[var(--theme-accent)]" size={24} />
            <p className="text-3xl font-black text-[#F0F4F2]">
              {profile.stats.projectsJoined}
            </p>
            <p className="text-[9px] font-black text-[var(--theme-accent)]/60 uppercase tracking-widest">
              Projects Joined
            </p>
          </div>
          <div className="bg-[var(--theme-card-alt)] p-6 rounded-[2rem] text-center border border-white/5">
            <CheckCircle className="mx-auto mb-2 text-[var(--theme-accent)]" size={24} />
            <p className="text-3xl font-black text-[#F0F4F2]">
              {profile.stats.projectsCompleted}
            </p>
            <p className="text-[9px] font-black text-[var(--theme-accent)]/60 uppercase tracking-widest">
              Completed
            </p>
          </div>
          <div className="bg-[var(--theme-muted)] p-6 rounded-[2rem] text-center">
            <TrendingUp className="mx-auto mb-2 text-[var(--theme-accent)]" size={24} />
            <p className="text-3xl font-black text-[#F0F4F2]">
              {profile.techStack.length}
            </p>
            <p className="text-[9px] font-black text-[var(--theme-accent)]/60 uppercase tracking-widest">
              Skills
            </p>
          </div>
        </div>

        {/* Skills Section */}
        <div className="bg-[var(--theme-card-alt)] rounded-[2.5rem] p-8 border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black   uppercase text-[#F0F4F2] tracking-tighter">
              Skills & Technologies
            </h2>
            <button
              onClick={() => setEditingStack(!editingStack)}
              className="p-2 bg-white/5 rounded-xl text-[var(--theme-accent)] hover:bg-[var(--theme-accent)] hover:text-[var(--theme-background)] transition-all"
            >
              <Pencil size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.techStack.map((tech) => (
              <span
                key={tech}
                className="bg-[var(--theme-card)] border border-white/5 text-[var(--theme-accent)] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
              >
                {tech}
                {editingStack && (
                  <X
                    size={12}
                    className="cursor-pointer hover:text-red-400"
                    onClick={() =>
                      patchProfile({
                        techStack: profile.techStack.filter((t) => t !== tech),
                      })
                    }
                  />
                )}
              </span>
            ))}
            {editingStack && (
              <div className="flex gap-2">
                <input
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTech.trim()) {
                      handleAddSkillClick();
                    }
                  }}
                  className="bg-[var(--theme-card)] border border-[var(--theme-accent)]/30 px-4 py-2 rounded-xl text-[10px] text-white outline-none uppercase tracking-widest"
                  placeholder="Add skill..."
                />
                <button
                  onClick={handleAddSkillClick}
                  className="p-2 bg-[var(--theme-accent)] rounded-xl text-[var(--theme-background)]"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
            {profile.techStack.length === 0 && !editingStack && (
              <p className="text-[var(--theme-accent)]/40 text-xs">
                No skills added yet. Click edit to add your skills.
              </p>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* README Section */}
          <div className="col-span-12 lg:col-span-7 bg-[var(--theme-card-alt)] rounded-[2.5rem] p-8 border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black   uppercase text-[#F0F4F2] tracking-tighter">
                About Me
              </h2>
              <button
                onClick={() => setEditingReadme(!editingReadme)}
                className="p-2 bg-white/5 rounded-xl text-[var(--theme-accent)] hover:bg-[var(--theme-accent)] hover:text-[var(--theme-background)] transition-all"
              >
                {editingReadme ? <Save size={14} /> : <Pencil size={14} />}
              </button>
            </div>
            {editingReadme ? (
              <textarea
                className="w-full bg-[var(--theme-card)] border border-[var(--theme-accent)]/30 p-6 rounded-2xl min-h-[200px] text-[#F0F4F2] outline-none text-sm"
                value={profile.readme}
                onBlur={() => {
                  setEditingReadme(false);
                  patchProfile({ readme: profile.readme });
                }}
                onChange={(e) =>
                  setProfile({ ...profile, readme: e.target.value })
                }
                placeholder="Write about yourself, your interests, what you're looking for..."
              />
            ) : (
              <div className="bg-[var(--theme-card)] p-6 rounded-2xl border border-white/5 min-h-[200px]">
                <p className="whitespace-pre-wrap text-[#F0F4F2]/70 text-sm leading-relaxed">
                  {profile.readme || "Tell others about yourself..."}
                </p>
              </div>
            )}
          </div>

          {/* GitHub Stats */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <div className="bg-[var(--theme-card-alt)] p-8 rounded-[2.5rem] border border-white/5">
              <h2 className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-[0.2em] mb-4 opacity-60">
                GitHub Activity
              </h2>
              {profile.links?.github ? (
                <div className="bg-[var(--theme-card)] p-4 rounded-2xl border border-white/5">
                  <img
                    src={`https://streak-stats.demolab.com?user=${extractUsername(profile.links.github)}&theme=dark&hide_border=true&background=1A2323&stroke=88AB8E&ring=88AB8E&fire=88AB8E&currStreakLabel=88AB8E`}
                    alt="GitHub Streak"
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="bg-[var(--theme-card)] p-8 rounded-2xl border border-white/5 text-center">
                  <Github
                    className="mx-auto mb-3 text-[var(--theme-accent)]/30"
                    size={32}
                  />
                  <p className="text-[#F0F4F2]/30 text-xs">
                    Add your GitHub link to show stats
                  </p>
                </div>
              )}
            </div>

            <div className="bg-[var(--theme-muted)] p-8 rounded-[2.5rem]">
              <Award className="mb-4 text-[var(--theme-accent)]" size={28} />
              <h3 className="text-xl font-black   uppercase tracking-tighter text-[#F0F4F2] mb-2">
                Verified Member
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-accent)]/60">
                UNIRIVO Community
              </p>
            </div>
          </div>
        </div>

        {/* Experience Section */}
        <div className="bg-[var(--theme-card-alt)] rounded-[2.5rem] p-8 border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Briefcase className="text-[var(--theme-accent)]" size={20} />
              <h2 className="text-lg font-black   uppercase text-[#F0F4F2] tracking-tighter">
                Experience
              </h2>
            </div>
            <button
              onClick={() => {
                setEditingExperience(null);
                setNewExperience({});
                setShowExperienceModal(true);
              }}
              className="px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {profile.experience.length > 0 ? (
            <div className="space-y-4">
              {profile.experience.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-[var(--theme-card)] p-6 rounded-2xl border border-white/5 group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-black text-[#F0F4F2]">
                        {exp.title}
                      </h3>
                      <p className="text-xs text-[var(--theme-accent)] flex items-center gap-2 mt-1">
                        <Building size={12} /> {exp.company}{" "}
                        {exp.location && `• ${exp.location}`}
                      </p>
                      <p className="text-[10px] text-[var(--theme-accent)]/60 flex items-center gap-2 mt-1">
                        <Calendar size={10} /> {exp.startDate} -{" "}
                        {exp.current ? "Present" : exp.endDate}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-[#F0F4F2]/60 mt-3">
                          {exp.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => {
                          setEditingExperience(exp);
                          setShowExperienceModal(true);
                        }}
                        className="p-2 bg-white/5 rounded-lg hover:bg-white/10"
                      >
                        <Pencil size={12} className="text-[var(--theme-accent)]" />
                      </button>
                      <button
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20"
                      >
                        <X size={12} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--theme-card)] p-8 rounded-2xl border border-dashed border-white/10 text-center">
              <Briefcase className="mx-auto mb-3 text-[var(--theme-accent)]/30" size={32} />
              <p className="text-[#F0F4F2]/30 text-xs">
                No experience added yet
              </p>
            </div>
          )}
        </div>

        {/* Education Section */}
        <div className="bg-[var(--theme-card-alt)] rounded-[2.5rem] p-8 border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="text-[var(--theme-accent)]" size={20} />
              <h2 className="text-lg font-black   uppercase text-[#F0F4F2] tracking-tighter">
                Education
              </h2>
            </div>
            <button
              onClick={() => {
                setEditingEducation(null);
                setNewEducation({});
                setShowEducationModal(true);
              }}
              className="px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {profile.education.length > 0 ? (
            <div className="space-y-4">
              {profile.education.map((edu) => (
                <div
                  key={edu.id}
                  className="bg-[var(--theme-card)] p-6 rounded-2xl border border-white/5 group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-black text-[#F0F4F2]">
                        {edu.degree}
                      </h3>
                      <p className="text-xs text-[var(--theme-accent)] mt-1">
                        {edu.school} {edu.field && `• ${edu.field}`}
                      </p>
                      <p className="text-[10px] text-[var(--theme-accent)]/60 flex items-center gap-2 mt-1">
                        <Calendar size={10} /> {edu.startDate} - {edu.endDate}
                      </p>
                      {edu.description && (
                        <p className="text-xs text-[#F0F4F2]/60 mt-3">
                          {edu.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => {
                          setEditingEducation(edu);
                          setShowEducationModal(true);
                        }}
                        className="p-2 bg-white/5 rounded-lg hover:bg-white/10"
                      >
                        <Pencil size={12} className="text-[var(--theme-accent)]" />
                      </button>
                      <button
                        onClick={() => handleDeleteEducation(edu.id)}
                        className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20"
                      >
                        <X size={12} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--theme-card)] p-8 rounded-2xl border border-dashed border-white/10 text-center">
              <GraduationCap
                className="mx-auto mb-3 text-[var(--theme-accent)]/30"
                size={32}
              />
              <p className="text-[#F0F4F2]/30 text-xs">
                No education added yet
              </p>
            </div>
          )}
        </div>

        {/* GitHub Activity Graph */}
        {profile.links?.github && (
          <div className="bg-[var(--theme-card-alt)] border border-white/5 rounded-[2.5rem] p-8">
            <h2 className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-[0.2em] mb-6">
              Contribution Activity
            </h2>
            <div className="bg-[var(--theme-card)] p-6 rounded-2xl border border-white/5 overflow-hidden">
              <img
                src={`https://github-readme-activity-graph.vercel.app/graph?username=${extractUsername(profile.links.github)}&theme=react-dark&hide_border=true&bg_color=1A2323&color=88AB8E&line=88AB8E&point=F0F4F2`}
                alt="Activity Graph"
                className="w-full rounded-xl"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Links Modal */}
      <AnimatePresence>
        {showLinksModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLinksModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--theme-card-alt)] w-full max-w-lg rounded-[2rem] p-8 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black   uppercase text-[#F0F4F2]">
                  Edit Links
                </h2>
                <button
                  onClick={() => setShowLinksModal(false)}
                  className="p-2 bg-white/5 rounded-lg hover:bg-white/10"
                >
                  <X size={16} className="text-[#F0F4F2]" />
                </button>
              </div>
              <div className="space-y-4">
                {Object.entries(profile.links).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-[var(--theme-card)] border border-white/5 rounded-xl p-4"
                  >
                    <label className="text-[9px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 block capitalize">
                      {key}
                    </label>
                    <input
                      type="url"
                      value={value || ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          links: { ...profile.links, [key]: e.target.value },
                        })
                      }
                      className="w-full bg-transparent outline-none text-sm text-[#F0F4F2]"
                      placeholder={`https://${key}.com/username`}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  patchProfile({ links: profile.links });
                  setShowLinksModal(false);
                }}
                className="w-full mt-6 py-4 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
              >
                Save Links
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Experience Modal */}
      <AnimatePresence>
        {showExperienceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowExperienceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--theme-card-alt)] w-full max-w-lg rounded-[2rem] p-8 border border-white/10 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black   uppercase text-[#F0F4F2]">
                  {editingExperience ? "Edit Experience" : "Add Experience"}
                </h2>
                <button
                  onClick={() => setShowExperienceModal(false)}
                  className="p-2 bg-white/5 rounded-lg hover:bg-white/10"
                >
                  <X size={16} className="text-[#F0F4F2]" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Job Title"
                  value={editingExperience?.title || newExperience.title || ""}
                  onChange={(e) =>
                    editingExperience
                      ? setEditingExperience({
                          ...editingExperience,
                          title: e.target.value,
                        })
                      : setNewExperience({
                          ...newExperience,
                          title: e.target.value,
                        })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={
                    editingExperience?.company || newExperience.company || ""
                  }
                  onChange={(e) =>
                    editingExperience
                      ? setEditingExperience({
                          ...editingExperience,
                          company: e.target.value,
                        })
                      : setNewExperience({
                          ...newExperience,
                          company: e.target.value,
                        })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={
                    editingExperience?.location || newExperience.location || ""
                  }
                  onChange={(e) =>
                    editingExperience
                      ? setEditingExperience({
                          ...editingExperience,
                          location: e.target.value,
                        })
                      : setNewExperience({
                          ...newExperience,
                          location: e.target.value,
                        })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Start Date (e.g., Jan 2023)"
                    value={
                      editingExperience?.startDate ||
                      newExperience.startDate ||
                      ""
                    }
                    onChange={(e) =>
                      editingExperience
                        ? setEditingExperience({
                            ...editingExperience,
                            startDate: e.target.value,
                          })
                        : setNewExperience({
                            ...newExperience,
                            startDate: e.target.value,
                          })
                    }
                    className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none"
                  />
                  <input
                    type="text"
                    placeholder="End Date"
                    value={
                      editingExperience?.endDate || newExperience.endDate || ""
                    }
                    onChange={(e) =>
                      editingExperience
                        ? setEditingExperience({
                            ...editingExperience,
                            endDate: e.target.value,
                          })
                        : setNewExperience({
                            ...newExperience,
                            endDate: e.target.value,
                          })
                    }
                    disabled={
                      editingExperience?.current || newExperience.current
                    }
                    className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none disabled:opacity-50"
                  />
                </div>
                <label className="flex items-center gap-3 text-sm text-[#F0F4F2]">
                  <input
                    type="checkbox"
                    checked={
                      editingExperience?.current ||
                      newExperience.current ||
                      false
                    }
                    onChange={(e) =>
                      editingExperience
                        ? setEditingExperience({
                            ...editingExperience,
                            current: e.target.checked,
                          })
                        : setNewExperience({
                            ...newExperience,
                            current: e.target.checked,
                          })
                    }
                    className="w-4 h-4 rounded accent-[var(--theme-accent)]"
                  />
                  Currently working here
                </label>
                <textarea
                  placeholder="Description (optional)"
                  value={
                    editingExperience?.description ||
                    newExperience.description ||
                    ""
                  }
                  onChange={(e) =>
                    editingExperience
                      ? setEditingExperience({
                          ...editingExperience,
                          description: e.target.value,
                        })
                      : setNewExperience({
                          ...newExperience,
                          description: e.target.value,
                        })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none min-h-[100px]"
                />
              </div>
              <button
                onClick={
                  editingExperience
                    ? handleUpdateExperience
                    : handleAddExperience
                }
                disabled={saving}
                className="w-full mt-6 py-4 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="animate-spin mx-auto" size={20} />
                ) : editingExperience ? (
                  "Update"
                ) : (
                  "Add Experience"
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Education Modal */}
      <AnimatePresence>
        {showEducationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEducationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--theme-card-alt)] w-full max-w-lg rounded-[2rem] p-8 border border-white/10 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black   uppercase text-[#F0F4F2]">
                  {editingEducation ? "Edit Education" : "Add Education"}
                </h2>
                <button
                  onClick={() => setShowEducationModal(false)}
                  className="p-2 bg-white/5 rounded-lg hover:bg-white/10"
                >
                  <X size={16} className="text-[#F0F4F2]" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Degree (e.g., Bachelor's, Master's)"
                  value={editingEducation?.degree || newEducation.degree || ""}
                  onChange={(e) =>
                    editingEducation
                      ? setEditingEducation({
                          ...editingEducation,
                          degree: e.target.value,
                        })
                      : setNewEducation({
                          ...newEducation,
                          degree: e.target.value,
                        })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none"
                />
                <input
                  type="text"
                  placeholder="School / University"
                  value={editingEducation?.school || newEducation.school || ""}
                  onChange={(e) =>
                    editingEducation
                      ? setEditingEducation({
                          ...editingEducation,
                          school: e.target.value,
                        })
                      : setNewEducation({
                          ...newEducation,
                          school: e.target.value,
                        })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none"
                />
                <input
                  type="text"
                  placeholder="Field of Study"
                  value={editingEducation?.field || newEducation.field || ""}
                  onChange={(e) =>
                    editingEducation
                      ? setEditingEducation({
                          ...editingEducation,
                          field: e.target.value,
                        })
                      : setNewEducation({
                          ...newEducation,
                          field: e.target.value,
                        })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Start Year"
                    value={
                      editingEducation?.startDate ||
                      newEducation.startDate ||
                      ""
                    }
                    onChange={(e) =>
                      editingEducation
                        ? setEditingEducation({
                            ...editingEducation,
                            startDate: e.target.value,
                          })
                        : setNewEducation({
                            ...newEducation,
                            startDate: e.target.value,
                          })
                    }
                    className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none"
                  />
                  <input
                    type="text"
                    placeholder="End Year"
                    value={
                      editingEducation?.endDate || newEducation.endDate || ""
                    }
                    onChange={(e) =>
                      editingEducation
                        ? setEditingEducation({
                            ...editingEducation,
                            endDate: e.target.value,
                          })
                        : setNewEducation({
                            ...newEducation,
                            endDate: e.target.value,
                          })
                    }
                    className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none"
                  />
                </div>
                <textarea
                  placeholder="Description (optional)"
                  value={
                    editingEducation?.description ||
                    newEducation.description ||
                    ""
                  }
                  onChange={(e) =>
                    editingEducation
                      ? setEditingEducation({
                          ...editingEducation,
                          description: e.target.value,
                        })
                      : setNewEducation({
                          ...newEducation,
                          description: e.target.value,
                        })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none min-h-[100px]"
                />
              </div>
              <button
                onClick={
                  editingEducation ? handleUpdateEducation : handleAddEducation
                }
                disabled={saving}
                className="w-full mt-6 py-4 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="animate-spin mx-auto" size={20} />
                ) : editingEducation ? (
                  "Update"
                ) : (
                  "Add Education"
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saving Indicator */}
      <AnimatePresence>
        {saving && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 bg-[var(--theme-accent)] text-[var(--theme-background)] px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-xl"
          >
            <Loader2 className="animate-spin" size={16} /> Saving...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skill Quiz Modal */}
      <SkillQuizModal
        skill={pendingSkill}
        isOpen={showSkillQuiz}
        onClose={handleSkillQuizClose}
        onSuccess={handleSkillQuizSuccess}
      />
    </div>
  );
}
