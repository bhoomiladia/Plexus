"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  X,
  Loader2,
  Flag,
  ListTodo,
  Package,
  MessageSquare,
  Send,
  Bot,
  Wand2,
} from "lucide-react";

interface Milestone {
  _id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  targetDate: string | null;
  completedDate?: string | null;
  suggestedTasks: string[];
  deliverables: string[];
  progress: number;
  order: number;
}

interface MilestoneSectionProps {
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  tasks: any[];
  teamSize: number;
  isOwner: boolean;
  onCreateTaskFromSuggestion?: (taskTitle: string) => void;
}

const priorityColors = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusConfig = {
  pending: { icon: Clock, color: "var(--theme-accent)", label: "Pending" },
  "in-progress": { icon: AlertCircle, color: "#F59E0B", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "#10B981", label: "Completed" },
};

export default function MilestoneSection({
  projectId,
  projectTitle,
  projectDescription,
  tasks,
  teamSize,
  isOwner,
  onCreateTaskFromSuggestion,
}: MilestoneSectionProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [generatedMilestones, setGeneratedMilestones] = useState<any[]>([]);
  const [duration, setDuration] = useState("3 months");

  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    targetDate: "",
  });

  // AI Chat state
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Enhancement state
  const [enhancing, setEnhancing] = useState<string | null>(null);
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);
  const [selectedMilestoneForEnhance, setSelectedMilestoneForEnhance] = useState<Milestone | null>(null);

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    try {
      const res = await fetch(`/api/project/${projectId}/milestones`);
      if (res.ok) {
        const data = await res.json();
        setMilestones(data.milestones || []);
      }
    } catch (error) {
      console.error("Error fetching milestones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMilestones = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/project/${projectId}/milestones/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle,
          projectDescription,
          existingTasks: tasks,
          teamSize,
          duration,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedMilestones(data.milestones || []);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to generate milestones");
      }
    } catch (error) {
      console.error("Error generating milestones:", error);
      alert("Failed to generate milestones");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveGeneratedMilestones = async () => {
    try {
      const res = await fetch(`/api/project/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestones: generatedMilestones }),
      });

      if (res.ok) {
        const data = await res.json();
        setMilestones((prev) => [...prev, ...data.milestones]);
        setShowGenerateModal(false);
        setGeneratedMilestones([]);
      } else {
        alert("Failed to save milestones");
      }
    } catch (error) {
      console.error("Error saving milestones:", error);
      alert("Failed to save milestones");
    }
  };

  const handleCreateMilestone = async () => {
    if (!newMilestone.title.trim()) return;

    try {
      const res = await fetch(`/api/project/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestone: newMilestone }),
      });

      if (res.ok) {
        const data = await res.json();
        setMilestones((prev) => [...prev, data.milestone]);
        setShowAddModal(false);
        setNewMilestone({ title: "", description: "", priority: "medium", targetDate: "" });
      }
    } catch (error) {
      console.error("Error creating milestone:", error);
      alert("Failed to create milestone");
    }
  };

  const handleUpdateStatus = async (milestoneId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/project/${projectId}/milestones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId, status: newStatus }),
      });

      if (res.ok) {
        setMilestones((prev) =>
          prev.map((m) =>
            m._id === milestoneId
              ? { ...m, status: newStatus as Milestone["status"], progress: newStatus === "completed" ? 100 : m.progress }
              : m
          )
        );
      }
    } catch (error) {
      console.error("Error updating milestone:", error);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm("Delete this milestone?")) return;

    try {
      const res = await fetch(`/api/project/${projectId}/milestones?milestoneId=${milestoneId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMilestones((prev) => prev.filter((m) => m._id !== milestoneId));
      }
    } catch (error) {
      console.error("Error deleting milestone:", error);
    }
  };

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const overallProgress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const res = await fetch(`/api/project/${projectId}/milestones/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context: chatMessages.slice(-6), // Keep last 6 messages for context
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      } else {
        setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that request. Please try again." }]);
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
      setChatMessages((prev) => [...prev, { role: "assistant", content: "An error occurred. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleEnhanceMilestone = async (milestone: Milestone, enhanceType: string) => {
    setEnhancing(enhanceType);
    setSelectedMilestoneForEnhance(milestone);
    setShowEnhanceModal(true);

    try {
      const res = await fetch(`/api/project/${projectId}/milestones/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: milestone._id,
          milestoneTitle: milestone.title,
          milestoneDescription: milestone.description,
          enhanceType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEnhancedData(data);
      } else {
        alert("Failed to enhance milestone");
        setShowEnhanceModal(false);
      }
    } catch (error) {
      console.error("Error enhancing milestone:", error);
      alert("Failed to enhance milestone");
      setShowEnhanceModal(false);
    } finally {
      setEnhancing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--theme-card)] rounded-[2.5rem] border border-white/5 p-8">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="animate-spin text-[var(--theme-accent)]" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase text-[#F0F4F2] tracking-tighter flex items-center gap-3">
            <Target className="text-[var(--theme-accent)]" size={24} />
            Project Milestones
          </h3>
          <p className="text-[10px] font-black text-[var(--theme-accent)]/60 uppercase tracking-widest mt-1">
            {milestones.length} milestones • {overallProgress}% complete
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[var(--theme-muted)] to-[var(--theme-accent)] text-[#F0F4F2] rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
            >
              <Sparkles size={16} /> AI Generate
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
            >
              <Plus size={16} /> Add
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {milestones.length > 0 && (
        <div className="bg-[var(--theme-card-alt)] rounded-2xl p-4 border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest">
              Overall Progress
            </span>
            <span className="text-sm font-black text-[#F0F4F2]">{overallProgress}%</span>
          </div>
          <div className="h-2 bg-[var(--theme-card)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              className="h-full bg-gradient-to-r from-[var(--theme-accent)] to-[#10B981] rounded-full"
            />
          </div>
        </div>
      )}

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <div className="bg-[var(--theme-card)] rounded-[2.5rem] border border-white/5 p-12 text-center">
          <Target className="mx-auto text-white/10 mb-4" size={48} />
          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4">
            No milestones yet
          </p>
          {isOwner && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--theme-muted)] text-[#F0F4F2] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[var(--theme-accent)] hover:text-[var(--theme-card)] transition-all"
            >
              <Sparkles size={14} /> Generate with AI
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const StatusIcon = statusConfig[milestone.status].icon;
            const isExpanded = expandedMilestone === milestone._id;

            return (
              <motion.div
                key={milestone._id}
                layout
                className="bg-[var(--theme-card-alt)] rounded-[2rem] border border-white/5 overflow-hidden"
              >
                {/* Milestone Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-white/[0.02] transition-all"
                  onClick={() => setExpandedMilestone(isExpanded ? null : milestone._id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: `${statusConfig[milestone.status].color}20` }}
                      >
                        <StatusIcon size={20} style={{ color: statusConfig[milestone.status].color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black text-white/30 uppercase">
                            M{index + 1}
                          </span>
                          <h4 className="font-black text-[#F0F4F2] text-lg">{milestone.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${priorityColors[milestone.priority]}`}>
                            {milestone.priority}
                          </span>
                        </div>
                        <p className="text-sm text-white/50 line-clamp-1">{milestone.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {milestone.targetDate && (
                        <div className="flex items-center gap-1.5 text-white/40">
                          <Calendar size={14} />
                          <span className="text-xs font-bold">
                            {new Date(milestone.targetDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-white/30" />
                      ) : (
                        <ChevronDown size={20} className="text-white/30" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5"
                    >
                      <div className="p-6 space-y-6">
                        {/* Description */}
                        <div>
                          <h5 className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest mb-2">
                            Description
                          </h5>
                          <p className="text-white/60 text-sm">{milestone.description}</p>
                        </div>

                        {/* Suggested Tasks */}
                        {milestone.suggestedTasks?.length > 0 && (
                          <div>
                            <h5 className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest mb-3 flex items-center gap-2">
                              <ListTodo size={14} /> Suggested Tasks
                            </h5>
                            <div className="space-y-2">
                              {milestone.suggestedTasks.map((task, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between p-3 bg-[var(--theme-card)] rounded-xl group"
                                >
                                  <span className="text-sm text-white/60">{task}</span>
                                  {isOwner && onCreateTaskFromSuggestion && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onCreateTaskFromSuggestion(task);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[var(--theme-accent)] hover:text-[var(--theme-card)] transition-all"
                                    >
                                      Create Task
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Deliverables */}
                        {milestone.deliverables?.length > 0 && (
                          <div>
                            <h5 className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Package size={14} /> Deliverables
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {milestone.deliverables.map((d, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1.5 bg-[var(--theme-card)] rounded-lg text-xs text-white/60"
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        {isOwner && (
                          <div className="space-y-4 pt-4 border-t border-white/5">
                            {/* AI Enhancement Buttons */}
                            <div>
                              <h5 className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Wand2 size={14} /> AI Enhancements
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEnhanceMilestone(milestone, "tasks");
                                  }}
                                  className="px-3 py-2 bg-[var(--theme-card)] text-white/60 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[var(--theme-muted)] hover:text-white transition-all flex items-center gap-1.5"
                                >
                                  <ListTodo size={12} /> Generate Tasks
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEnhanceMilestone(milestone, "risks");
                                  }}
                                  className="px-3 py-2 bg-[var(--theme-card)] text-white/60 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[var(--theme-muted)] hover:text-white transition-all flex items-center gap-1.5"
                                >
                                  <AlertCircle size={12} /> Identify Risks
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEnhanceMilestone(milestone, "timeline");
                                  }}
                                  className="px-3 py-2 bg-[var(--theme-card)] text-white/60 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[var(--theme-muted)] hover:text-white transition-all flex items-center gap-1.5"
                                >
                                  <Calendar size={12} /> Timeline Breakdown
                                </button>
                              </div>
                            </div>

                            {/* Status Buttons */}
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                {(["pending", "in-progress", "completed"] as const).map((status) => (
                                  <button
                                    key={status}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(milestone._id, status);
                                    }}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                      milestone.status === status
                                        ? "bg-[var(--theme-accent)] text-[var(--theme-background)]"
                                        : "bg-[var(--theme-card)] text-white/40 hover:text-white"
                                    }`}
                                  >
                                    {statusConfig[status].label}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMilestone(milestone._id);
                                }}
                                className="p-2 text-red-500/50 hover:text-red-500 transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* AI Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-[var(--theme-background)]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--theme-card-alt)] rounded-[3rem] p-10 max-w-2xl w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-[#F0F4F2] uppercase tracking-tighter flex items-center gap-3">
                  <Sparkles className="text-[var(--theme-accent)]" /> AI Milestone Generator
                </h2>
                <p className="text-[10px] font-black text-[var(--theme-accent)]/60 uppercase tracking-widest mt-1">
                  Generate smart milestones based on your project
                </p>
              </div>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setGeneratedMilestones([]);
                }}
                className="p-2 text-white/40 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {generatedMilestones.length === 0 ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-60">
                    Expected Project Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-bold"
                  >
                    <option value="1 month">1 Month</option>
                    <option value="2 months">2 Months</option>
                    <option value="3 months">3 Months</option>
                    <option value="6 months">6 Months</option>
                    <option value="1 year">1 Year</option>
                  </select>
                </div>

                <div className="p-4 bg-[var(--theme-card)] rounded-xl border border-white/5">
                  <p className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest mb-2">
                    Project Context
                  </p>
                  <p className="text-sm text-white/60">{projectTitle}</p>
                  <p className="text-xs text-white/40 mt-1 line-clamp-2">{projectDescription}</p>
                </div>

                <button
                  onClick={handleGenerateMilestones}
                  disabled={generating}
                  className="w-full py-4 bg-gradient-to-r from-[var(--theme-muted)] to-[var(--theme-accent)] text-[#F0F4F2] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate Milestones
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm text-white/60">
                  Review the generated milestones below. Click "Save All" to add them to your project.
                </p>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {generatedMilestones.map((m, index) => (
                    <div
                      key={index}
                      className="p-5 bg-[var(--theme-card)] rounded-2xl border border-white/5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-[var(--theme-accent)] uppercase">
                            M{index + 1}
                          </span>
                          <h4 className="font-bold text-[#F0F4F2]">{m.title}</h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${priorityColors[m.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
                          {m.priority}
                        </span>
                      </div>
                      <p className="text-sm text-white/50 mb-3">{m.description}</p>
                      {m.targetDate && (
                        <div className="flex items-center gap-1.5 text-white/40 text-xs mb-3">
                          <Calendar size={12} />
                          Target: {new Date(m.targetDate).toLocaleDateString()}
                        </div>
                      )}
                      {m.suggestedTasks?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-[9px] font-black text-[var(--theme-accent)]/60 uppercase tracking-widest mb-2">
                            Suggested Tasks
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {m.suggestedTasks.slice(0, 3).map((task: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/50">
                                {task}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSaveGeneratedMilestones}
                    className="flex-1 py-4 bg-[var(--theme-accent)] text-[var(--theme-background)] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all"
                  >
                    Save All Milestones
                  </button>
                  <button
                    onClick={() => setGeneratedMilestones([])}
                    className="px-6 py-4 bg-white/5 text-[#F0F4F2]/40 font-black uppercase tracking-widest rounded-xl hover:text-white transition-all"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Add Manual Milestone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[var(--theme-background)]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--theme-card-alt)] rounded-[3rem] p-10 max-w-lg w-full border border-white/10 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-[#F0F4F2] uppercase tracking-tighter">
                New Milestone
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-white/40 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-60">
                  Title
                </label>
                <input
                  type="text"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-bold placeholder:text-white/10"
                  placeholder="Milestone title..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-60">
                  Description
                </label>
                <textarea
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-medium placeholder:text-white/10 resize-none"
                  placeholder="What needs to be achieved..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-60">
                    Priority
                  </label>
                  <select
                    value={newMilestone.priority}
                    onChange={(e) => setNewMilestone((prev) => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-bold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-60">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={newMilestone.targetDate}
                    onChange={(e) => setNewMilestone((prev) => ({ ...prev, targetDate: e.target.value }))}
                    className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCreateMilestone}
                  disabled={!newMilestone.title.trim()}
                  className="flex-1 py-4 bg-[var(--theme-accent)] text-[var(--theme-background)] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Milestone
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-4 bg-white/5 text-[#F0F4F2]/40 font-black uppercase tracking-widest rounded-xl hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Enhancement Modal */}
      {showEnhanceModal && selectedMilestoneForEnhance && (
        <div className="fixed inset-0 bg-[var(--theme-background)]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--theme-card-alt)] rounded-[3rem] p-10 max-w-2xl w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-[#F0F4F2] uppercase tracking-tighter flex items-center gap-3">
                  <Wand2 className="text-[var(--theme-accent)]" /> AI Enhancement
                </h2>
                <p className="text-[10px] font-black text-[var(--theme-accent)]/60 uppercase tracking-widest mt-1">
                  {selectedMilestoneForEnhance.title}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEnhanceModal(false);
                  setEnhancedData(null);
                  setSelectedMilestoneForEnhance(null);
                }}
                className="p-2 text-white/40 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {enhancing ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="animate-spin h-12 w-12 text-[var(--theme-accent)] mb-4" />
                <p className="text-[var(--theme-accent)] font-bold">Analyzing milestone...</p>
              </div>
            ) : enhancedData ? (
              <div className="space-y-6">
                {enhancedData.enhanceType === "tasks" && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-[var(--theme-accent)] uppercase tracking-widest">Generated Tasks</h3>
                    {enhancedData.data.map((task: any, i: number) => (
                      <div key={i} className="p-4 bg-[var(--theme-card)] rounded-xl border border-white/5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-bold text-[#F0F4F2]">{task.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-sm text-white/50 mb-2">{task.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/30">Est: {task.estimatedHours}h</span>
                          {onCreateTaskFromSuggestion && (
                            <button
                              onClick={() => onCreateTaskFromSuggestion(task.title)}
                              className="px-3 py-1 bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] rounded-lg text-[10px] font-black uppercase hover:bg-[var(--theme-accent)] hover:text-[var(--theme-card)] transition-all"
                            >
                              Create Task
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {enhancedData.enhanceType === "risks" && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-[var(--theme-accent)] uppercase tracking-widest">Identified Risks</h3>
                    {enhancedData.data.map((risk: any, i: number) => (
                      <div key={i} className="p-4 bg-[var(--theme-card)] rounded-xl border border-white/5">
                        <div className="flex items-start gap-3 mb-2">
                          <AlertCircle size={18} className="text-red-400 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-bold text-[#F0F4F2]">{risk.risk}</h4>
                            <div className="flex gap-2 mt-2">
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px] font-black uppercase">
                                Impact: {risk.impact}
                              </span>
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-[9px] font-black uppercase">
                                Probability: {risk.probability}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-[var(--theme-card-alt)] rounded-lg">
                          <p className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-widest mb-1">Mitigation</p>
                          <p className="text-sm text-white/60">{risk.mitigation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {enhancedData.enhanceType === "timeline" && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-[var(--theme-accent)] uppercase tracking-widest">Timeline Breakdown</h3>
                    <div className="relative">
                      {enhancedData.data.map((phase: any, i: number) => (
                        <div key={i} className="flex gap-4 pb-6 last:pb-0">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-[var(--theme-accent)] flex items-center justify-center text-[var(--theme-card)] font-black text-sm">
                              {phase.order || i + 1}
                            </div>
                            {i < enhancedData.data.length - 1 && (
                              <div className="w-0.5 flex-1 bg-[var(--theme-accent)]/30 mt-2" />
                            )}
                          </div>
                          <div className="flex-1 p-4 bg-[var(--theme-card)] rounded-xl border border-white/5">
                            <h4 className="font-bold text-[#F0F4F2] mb-1">{phase.phase}</h4>
                            <p className="text-sm text-white/50 mb-2">{phase.description}</p>
                            <span className="text-[10px] font-black text-[var(--theme-accent)] uppercase">
                              Duration: {phase.durationDays} days
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowEnhanceModal(false);
                    setEnhancedData(null);
                    setSelectedMilestoneForEnhance(null);
                  }}
                  className="w-full py-4 bg-[var(--theme-accent)] text-[var(--theme-background)] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all"
                >
                  Done
                </button>
              </div>
            ) : null}
          </motion.div>
        </div>
      )}

      {/* Floating AI Chat Button */}
      {isOwner && (
        <button
          onClick={() => setShowAIChat(true)}
          className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-[var(--theme-muted)] to-[var(--theme-accent)] text-white rounded-full shadow-lg hover:scale-110 transition-all z-50"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* AI Chat Modal */}
      {showAIChat && (
        <div className="fixed inset-0 bg-[var(--theme-background)]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--theme-card-alt)] rounded-[3rem] max-w-2xl w-full border border-white/10 shadow-2xl h-[80vh] flex flex-col overflow-hidden"
          >
            {/* Chat Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--theme-accent)] rounded-xl">
                  <Bot size={20} className="text-[var(--theme-card)]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#F0F4F2] uppercase tracking-tighter">
                    AI Planning Assistant
                  </h2>
                  <p className="text-[10px] font-black text-[var(--theme-accent)]/60 uppercase tracking-widest">
                    Ask about milestones, tasks, or planning
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAIChat(false)}
                className="p-2 text-white/40 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-12">
                  <Bot className="mx-auto text-white/10 mb-4" size={48} />
                  <p className="text-white/30 text-sm mb-4">
                    Hi! I can help you plan your project milestones.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      "Suggest milestones for my project",
                      "How should I prioritize tasks?",
                      "What risks should I consider?",
                      "Help me create a timeline",
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setChatInput(suggestion);
                        }}
                        className="px-3 py-2 bg-[var(--theme-card)] text-white/50 rounded-lg text-xs hover:bg-[var(--theme-muted)] hover:text-white transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-[var(--theme-accent)] text-[var(--theme-card)]"
                        : "bg-[var(--theme-card)] text-white/80"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--theme-card)] p-4 rounded-2xl">
                    <Loader2 className="animate-spin text-[var(--theme-accent)]" size={20} />
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-white/5">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                  placeholder="Ask about your project planning..."
                  className="flex-1 bg-[var(--theme-card)] border border-white/5 rounded-xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-medium placeholder:text-white/20"
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="p-4 bg-[var(--theme-accent)] text-[var(--theme-card)] rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
