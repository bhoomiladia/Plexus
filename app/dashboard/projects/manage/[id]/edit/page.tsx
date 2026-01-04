"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Loader2, ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "OPEN",
    githubLink: "",
    demoLink: "",
  });

  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/project/${id}`);
        if (!res.ok) throw new Error("Project not found");
        const data = await res.json();
        const project = data.project;

        if (project.ownerId !== session?.user?.id) {
          setError("Authorized Personnel Only");
          return;
        }

        setFormData({
          title: project.title,
          description: project.description,
          status: project.status,
          githubLink: project.githubLink || "",
          demoLink: project.demoLink || "",
        });

        setRoles(
          project.roles.map((role: any) => ({
            _id: role._id,
            roleName: role.roleName,
            mandatorySkills: role.mandatorySkills || [],
            optionalSkills: role.optionalSkills || [],
            needed: role.needed,
            filled: role.filled,
          }))
        );
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (session && id) fetchProject();
  }, [session, id]);

  const addRole = () => {
    setRoles([
      ...roles,
      {
        roleName: "",
        mandatorySkills: [],
        optionalSkills: [],
        needed: 1,
        filled: 0,
      },
    ]);
  };

  const removeRole = (index: number) => {
    if (roles[index].filled > 0) {
      alert("Cannot remove a role with active units");
      return;
    }
    setRoles(roles.filter((_, i) => i !== index));
  };

  const handleRoleChange = (index: number, field: string, value: any) => {
    const updatedRoles = [...roles];
    updatedRoles[index] = { ...updatedRoles[index], [field]: value };
    setRoles(updatedRoles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/project/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, roles }),
      });
      if (response.ok) router.push(`/dashboard/projects/manage/${id}`);
    } catch (error) {
      setError("Sync Error: Protocol Failed");
    } finally {
      setSaving(false);
    }
  };

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
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-6 mb-12">
          <Link
            href={`/dashboard/projects/manage/${id}`}
            className="p-4 bg-[var(--theme-card-alt)] hover:bg-[var(--theme-muted)] rounded-2xl text-[var(--theme-accent)] transition-all border border-white/5"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-5xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
              Modify Project
            </h1>
            <p className="text-[var(--theme-accent)] font-bold tracking-[0.2em] text-[10px] uppercase opacity-60">
              UNIRIVO / UPDATE PROTOCOL
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-8">
          {error && (
            <div className="col-span-12 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold text-center uppercase tracking-widest">
              {error}
            </div>
          )}

          {/* Left Side: General Config */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <div className="bg-[var(--theme-card-alt)] p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-3 opacity-60">
                  Identity
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 rounded-2xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-3 opacity-60">
                  Operational Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 rounded-2xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none font-bold uppercase text-xs tracking-widest"
                >
                  <option value="OPEN">Open</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-3 opacity-60">
                  Briefing
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 rounded-2xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none min-h-[120px] text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || deleting}
              className="w-full py-6 bg-[var(--theme-accent)] text-[var(--theme-background)] font-black uppercase tracking-[0.3em] rounded-[2rem] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Save size={20} /> Commit Changes
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {}}
              className="w-full py-6 bg-red-500/10 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] transition-all"
            >
              <Trash2 size={16} className="inline mr-2" /> Terminate Project
            </button>
          </div>

          {/* Right Side: Deployment Roles */}
          <div className="col-span-12 lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center px-4 mb-2">
              <h2 className="text-xl font-black   text-[#F0F4F2] uppercase">
                Personnel Layout
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
                <div
                  key={index}
                  className="bg-[var(--theme-card-alt)] p-8 rounded-[2.5rem] border border-white/5 relative"
                >
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-8">
                      <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-50">
                        Role Designation
                      </label>
                      <input
                        required
                        value={role.roleName}
                        onChange={(e) =>
                          handleRoleChange(index, "roleName", e.target.value)
                        }
                        className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-3 text-[#F0F4F2] focus:ring-1 focus:ring-[var(--theme-accent)] outline-none text-sm font-bold"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-50">
                        Units ({role.filled})
                      </label>
                      <input
                        type="number"
                        min={role.filled}
                        value={role.needed}
                        onChange={(e) =>
                          handleRoleChange(
                            index,
                            "needed",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-3 text-[#F0F4F2] focus:ring-1 focus:ring-[var(--theme-accent)] outline-none text-sm font-bold"
                      />
                    </div>
                    <div className="col-span-12">
                      <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-50">
                        Required Skillsets
                      </label>
                      <input
                        value={role.mandatorySkills.join(", ")}
                        onChange={(e) =>
                          handleRoleChange(
                            index,
                            "mandatorySkills",
                            e.target.value.split(",").map((s) => s.trim())
                          )
                        }
                        className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-3 text-[#F0F4F2] text-xs"
                      />
                    </div>
                  </div>
                  {roles.length > 1 && role.filled === 0 && (
                    <button
                      type="button"
                      onClick={() => removeRole(index)}
                      className="absolute top-6 right-6 text-red-500/30 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
