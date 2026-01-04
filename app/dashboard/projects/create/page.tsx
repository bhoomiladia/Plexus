"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Rocket,
  Loader2,
  ArrowLeft,
  Trash2,
  Sparkles,
  Users,
  CheckCircle,
  X,
  User,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

interface MatchedProfile {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  skills: string[];
  matchedRole: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export default function CreateProjectPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMatchedProfiles, setShowMatchedProfiles] = useState(false);
  const [matchedProfiles, setMatchedProfiles] = useState<MatchedProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    userRole: "",
  });

  const [roles, setRoles] = useState([
    { roleName: "", mandatorySkills: [] as string[], needed: 1 },
  ]);

  const addRole = () => {
    setRoles([...roles, { roleName: "", mandatorySkills: [], needed: 1 }]);
  };

  const removeRole = (index: number) => {
    if (roles.length > 1) {
      setRoles(roles.filter((_, i) => i !== index));
    }
  };

  const handleRoleChange = (index: number, field: string, value: any) => {
    const updatedRoles = [...roles];
    updatedRoles[index] = { ...updatedRoles[index], [field]: value };
    setRoles(updatedRoles);
  };

  const handleAiGenerate = async () => {
    if (!formData.title || !formData.description) {
      setError("Please fill in Title and Description first!");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/generate-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.roles && Array.isArray(data.roles)) {
        setRoles(data.roles);
      } else {
        setError("AI returned invalid data format.");
      }
    } catch (err) {
      setError("AI failed to generate roles.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchedProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const response = await fetch("/api/projects/match-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      });

      if (response.ok) {
        const data = await response.json();
        setMatchedProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error("Error fetching matched profiles:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setError("Please login first");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, roles }),
      });

      if (response.ok) {
        const project = await response.json();
        setCreatedProjectId(project._id);
        setShowMatchedProfiles(true);
        await fetchMatchedProfiles();
      } else {
        setError("Failed to create project");
      }
    } catch (error) {
      setError("An error occurred while creating the project");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowMatchedProfiles(false);
    router.push("/dashboard/projects/manage");
  };

  const handleViewProject = () => {
    if (createdProjectId) {
      router.push(`/dashboard/projects/${createdProjectId}`);
    }
  };

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-6 mb-10">
          <Link
            href="/dashboard/projects/manage"
            className="p-4 bg-[var(--theme-card-alt)] hover:bg-[var(--theme-muted)] rounded-2xl text-[var(--theme-accent)] border border-white/5"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-5xl font-black uppercase text-[#F0F4F2] tracking-tighter">
              Launch Project
            </h1>
            <p className="text-[var(--theme-accent)] font-bold tracking-[0.2em] text-[10px] uppercase opacity-60">
              UNIRIVO / NEW VENTURE
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-8">
          {error && (
            <div className="col-span-12 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold text-center">
              {error}
            </div>
          )}

          {/* Left Side: General Info */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <div className="bg-[var(--theme-card-alt)] p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-3 opacity-60">
                  Project Title
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 rounded-2xl p-4 text-[#F0F4F2] outline-none font-bold"
                  placeholder="E.g. AI Content Engine"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-3 opacity-60">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 rounded-2xl p-4 text-[#F0F4F2] outline-none min-h-[150px]"
                  placeholder="What are we building?"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-3 opacity-60">
                  Your Role (to skip)
                </label>
                <input
                  type="text"
                  value={formData.userRole}
                  onChange={(e) =>
                    setFormData({ ...formData, userRole: e.target.value })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 rounded-2xl p-4 text-[#F0F4F2] outline-none font-bold"
                  placeholder="E.g. Lead Frontend"
                />
              </div>

              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={loading}
                className="w-full py-3 border border-[var(--theme-accent)]/30 text-[var(--theme-accent)] rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--theme-accent)] hover:text-[var(--theme-card)] transition-all text-xs font-black uppercase tracking-widest"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <Sparkles size={16} /> Auto-Fill Roles
                  </>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-[var(--theme-accent)] text-[var(--theme-card)] font-black uppercase tracking-[0.3em] rounded-[2rem] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Rocket size={20} /> Deploy Project
                </>
              )}
            </button>
          </div>

          {/* Right Side: Roles */}
          <div className="col-span-12 lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center px-4 mb-2">
              <h2 className="text-xl font-black text-[#F0F4F2] uppercase">
                Requirements
              </h2>
              <button
                type="button"
                onClick={addRole}
                className="p-2 bg-[var(--theme-accent)] rounded-xl text-[var(--theme-background)] hover:scale-110 transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-4 h-[500px] overflow-y-auto no-scrollbar pr-2">
              {roles.map((role, index) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={index}
                  className="bg-[var(--theme-card-alt)] p-6 rounded-[2.5rem] border border-white/5 relative"
                >
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-8">
                      <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-50">
                        Role Title
                      </label>
                      <input
                        required
                        value={role.roleName}
                        className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-3 text-[#F0F4F2] outline-none text-sm font-bold"
                        placeholder="Lead Developer"
                        onChange={(e) =>
                          handleRoleChange(index, "roleName", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-50">
                        Seats
                      </label>
                      <input
                        type="number"
                        value={role.needed}
                        className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-3 text-[#F0F4F2] outline-none text-sm font-bold"
                        onChange={(e) =>
                          handleRoleChange(
                            index,
                            "needed",
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="col-span-12">
                      <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-50">
                        Mandatory Skills
                      </label>
                      <input
                        value={role.mandatorySkills.join(", ")}
                        className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-3 text-[#F0F4F2] outline-none text-xs"
                        placeholder="React, TypeScript, AWS..."
                        onChange={(e) =>
                          handleRoleChange(
                            index,
                            "mandatorySkills",
                            e.target.value.split(",").map((s) => s.trim())
                          )
                        }
                      />
                    </div>
                  </div>

                  {roles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRole(index)}
                      className="absolute -top-2 -right-2 p-2 bg-red-500/20 text-red-400 rounded-full"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </form>
      </motion.div>

      {/* Matched Profiles Modal */}
      <AnimatePresence>
        {showMatchedProfiles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[var(--theme-card)] rounded-[3rem] border border-white/10 w-full max-w-4xl max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-[var(--theme-accent)] rounded-2xl">
                      <CheckCircle size={28} className="text-[var(--theme-card)]" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black uppercase text-[#F0F4F2] tracking-tighter">
                        Project Deployed!
                      </h2>
                      <p className="text-[var(--theme-accent)] text-sm font-bold mt-1">
                        Here are profiles matching your requirements
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-3 bg-[var(--theme-card-alt)] hover:bg-[var(--theme-muted)] rounded-xl text-[var(--theme-accent)] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(85vh-200px)]">
                {loadingProfiles ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="animate-spin h-12 w-12 text-[var(--theme-accent)] mb-4" />
                    <p className="text-[var(--theme-accent)] font-bold">Finding matching profiles...</p>
                  </div>
                ) : matchedProfiles.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="mx-auto mb-6 text-[#F0F4F2]/20" size={64} />
                    <h3 className="text-xl font-black uppercase text-[#F0F4F2]/40 tracking-widest mb-2">
                      No Matches Found
                    </h3>
                    <p className="text-[var(--theme-accent)]/50 text-sm">
                      No profiles match your project requirements yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-6">
                      <Users size={18} className="text-[var(--theme-accent)]" />
                      <span className="text-[var(--theme-accent)] font-bold text-sm">
                        {matchedProfiles.length} matching profile{matchedProfiles.length !== 1 ? 's' : ''} found
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matchedProfiles.map((profile, index) => (
                        <motion.div
                          key={profile._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-[var(--theme-card-alt)] p-6 rounded-[2rem] border border-white/5 hover:border-[var(--theme-accent)]/30 transition-all"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[var(--theme-muted)] flex items-center justify-center overflow-hidden flex-shrink-0">
                              {profile.avatar ? (
                                <img
                                  src={profile.avatar}
                                  alt={profile.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={24} className="text-[var(--theme-accent)]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h4 className="text-lg font-black text-[#F0F4F2] truncate">
                                  {profile.name}
                                </h4>
                                <div className="flex items-center gap-1 bg-[var(--theme-accent)] text-[var(--theme-card)] px-3 py-1 rounded-full flex-shrink-0">
                                  <Star size={12} />
                                  <span className="text-xs font-black">
                                    {profile.matchScore}%
                                  </span>
                                </div>
                              </div>
                              <p className="text-[var(--theme-accent)]/60 text-xs mb-3 truncate">
                                {profile.email}
                              </p>
                              
                              <div className="mb-3">
                                <span className="text-[8px] font-black uppercase text-[var(--theme-accent)] tracking-widest opacity-50">
                                  Best Match For
                                </span>
                                <p className="text-[#F0F4F2] text-sm font-bold">
                                  {profile.matchedRole}
                                </p>
                              </div>

                              {profile.matchedSkills.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {profile.matchedSkills.slice(0, 4).map((skill, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] text-[9px] font-bold rounded-lg"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {profile.matchedSkills.length > 4 && (
                                    <span className="px-2 py-1 text-[var(--theme-accent)]/40 text-[9px] font-bold">
                                      +{profile.matchedSkills.length - 4}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 flex gap-4">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 py-4 bg-[var(--theme-card-alt)] text-[var(--theme-accent)] font-black uppercase tracking-widest rounded-2xl hover:bg-[var(--theme-muted)] transition-colors text-sm"
                >
                  Go to Projects
                </button>
                <button
                  onClick={handleViewProject}
                  className="flex-1 py-4 bg-[var(--theme-accent)] text-[var(--theme-card)] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all text-sm"
                >
                  View Project
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
