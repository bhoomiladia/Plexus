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
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

export default function CreateProjectPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    userRole: "", // Added to track user's own role
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

  // --- AI GENERATION LOGIC ---
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
        // This is the magic part: it populates the state
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

      if (response.ok) router.push("/dashboard/projects/manage");
    } catch (error) {
      setError("An error occurred while creating the project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[#1A2323] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-6 mb-10">
          <Link
            href="/dashboard/projects/manage"
            className="p-4 bg-[#243131] hover:bg-[#3E5C58] rounded-2xl text-[#88AB8E] border border-white/5"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-5xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
              Launch Project
            </h1>
            <p className="text-[#88AB8E] font-bold tracking-[0.2em] text-[10px] uppercase opacity-60">
              PLEXUS / NEW VENTURE
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
            <div className="bg-[#243131] p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-[#88AB8E] tracking-widest mb-3 opacity-60">
                  Project Title
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-[#1A2323] border border-white/5 rounded-2xl p-4 text-[#F0F4F2] outline-none font-bold"
                  placeholder="E.g. AI Content Engine"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-[#88AB8E] tracking-widest mb-3 opacity-60">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-[#1A2323] border border-white/5 rounded-2xl p-4 text-[#F0F4F2] outline-none min-h-[150px]"
                  placeholder="What are we building?"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-[#88AB8E] tracking-widest mb-3 opacity-60">
                  Your Role (to skip)
                </label>
                <input
                  type="text"
                  value={formData.userRole}
                  onChange={(e) =>
                    setFormData({ ...formData, userRole: e.target.value })
                  }
                  className="w-full bg-[#1A2323] border border-white/5 rounded-2xl p-4 text-[#F0F4F2] outline-none font-bold"
                  placeholder="E.g. Lead Frontend"
                />
              </div>

              {/* AI Trigger Button */}
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={loading}
                className="w-full py-3 border border-[#88AB8E]/30 text-[#88AB8E] rounded-xl flex items-center justify-center gap-2 hover:bg-[#88AB8E] hover:text-[#1A2323] transition-all text-xs font-black uppercase tracking-widest"
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
              className="w-full py-6 bg-[#88AB8E] text-[#1A2323] font-black uppercase tracking-[0.3em] rounded-[2rem] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl"
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

          {/* Right Side: Roles (Controlled Inputs) */}
          <div className="col-span-12 lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center px-4 mb-2">
              <h2 className="text-xl font-black   text-[#F0F4F2] uppercase">
                Requirements
              </h2>
              <button
                type="button"
                onClick={addRole}
                className="p-2 bg-[#88AB8E] rounded-xl text-[#141C1C] hover:scale-110 transition-transform"
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
                  className="bg-[#243131] p-6 rounded-[2.5rem] border border-white/5 relative"
                >
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-8">
                      <label className="block text-[10px] font-black uppercase text-[#88AB8E] tracking-widest mb-2 opacity-50">
                        Role Title
                      </label>
                      <input
                        required
                        value={role.roleName} // Important for AI fill
                        className="w-full bg-[#1A2323] border border-white/5 rounded-xl p-3 text-[#F0F4F2] outline-none text-sm font-bold"
                        placeholder="Lead Developer"
                        onChange={(e) =>
                          handleRoleChange(index, "roleName", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[10px] font-black uppercase text-[#88AB8E] tracking-widest mb-2 opacity-50">
                        Seats
                      </label>
                      <input
                        type="number"
                        value={role.needed} // Important for AI fill
                        className="w-full bg-[#1A2323] border border-white/5 rounded-xl p-3 text-[#F0F4F2] outline-none text-sm font-bold"
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
                      <label className="block text-[10px] font-black uppercase text-[#88AB8E] tracking-widest mb-2 opacity-50">
                        Mandatory Skills
                      </label>
                      <input
                        value={role.mandatorySkills.join(", ")} // Important for AI fill
                        className="w-full bg-[#1A2323] border border-white/5 rounded-xl p-3 text-[#F0F4F2] outline-none text-xs"
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
    </div>
  );
}
