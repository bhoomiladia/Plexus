"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  GripVertical,
  Calendar,
  User,
  Trash2,
  Shield,
  BadgeCheck,
  Filter,
} from "lucide-react";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "verified";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

interface Member {
  visibleId?: string;
  userName: string;
  userEmail: string;
  role?: string;
}

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
  members: Member[];
  isOwner: boolean;
  currentUserEmail: string;
  currentUserName: string;
  isAuthorized: boolean;
  isTeamMember?: boolean;
  onTasksChange: (tasks: Task[]) => void;
}

const columns = [
  { id: "pending", title: "To Do", icon: Clock, color: "var(--theme-accent)" },
  { id: "in-progress", title: "In Progress", icon: AlertCircle, color: "#F59E0B" },
  { id: "completed", title: "Completed", icon: CheckCircle2, color: "#10B981" },
  { id: "verified", title: "Verified", icon: BadgeCheck, color: "#8B5CF6" },
];

const priorityColors = {
  low: "bg-blue-500/20 text-blue-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-red-500/20 text-red-400",
};

export default function KanbanBoard({
  projectId,
  tasks,
  members,
  isOwner,
  currentUserEmail,
  currentUserName,
  isAuthorized,
  isTeamMember = false,
  onTasksChange,
}: KanbanBoardProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterByUser, setFilterByUser] = useState<string>("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
    assignedTo: "",
    assignedToName: "",
  });

  // Check if current user is part of the team
  const isPartOfTeam = isOwner || isAuthorized || isTeamMember || 
    members.some(m => m.userEmail === currentUserEmail);

  // Check if user can modify a specific task
  const canModifyTask = (task: Task) => {
    if (isOwner) return true;
    // Authorized users and members can only modify their assigned tasks
    return task.assignedTo === currentUserEmail;
  };

  // Check if user can change task status (drag)
  const canChangeStatus = (task: Task, newStatus: string) => {
    if (isOwner) return true;
    // Users can only move their own tasks, but not to "verified"
    if (task.assignedTo !== currentUserEmail) return false;
    if (newStatus === "verified") return false;
    return true;
  };

  // Filter tasks based on selected user
  const filteredTasks = filterByUser === "all" 
    ? tasks 
    : filterByUser === "mine"
    ? tasks.filter(t => t.assignedTo === currentUserEmail)
    : tasks.filter(t => t.assignedTo === filterByUser);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      assignedTo: "",
      assignedToName: "",
    });
    setEditingTask(null);
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/project/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (res.ok) {
        onTasksChange([...tasks, data.task]);
        setShowAddModal(false);
        resetForm();
      } else {
        alert(data.error || "Failed to create task");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !formData.title.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/project/${projectId}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: editingTask._id, ...formData }),
      });

      if (res.ok) {
        onTasksChange(
          tasks.map((t) =>
            t._id === editingTask._id ? { ...t, ...formData } : t
          )
        );
        setShowAddModal(false);
        resetForm();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update task");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;

    try {
      const res = await fetch(
        `/api/project/${projectId}/tasks?taskId=${taskId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        onTasksChange(tasks.filter((t) => t._id !== taskId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete task");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete task");
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string, verifierName?: string) => {
    try {
      const body: any = { taskId, status: newStatus };
      if (newStatus === "verified" && verifierName) {
        body.verifiedBy = verifierName;
        body.verifiedAt = new Date().toISOString();
      }

      const res = await fetch(`/api/project/${projectId}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onTasksChange(
          tasks.map((t) =>
            t._id === taskId 
              ? { 
                  ...t, 
                  status: newStatus as Task["status"],
                  ...(newStatus === "verified" ? { verifiedBy: verifierName, verifiedAt: new Date().toISOString() } : {})
                } 
              : t
          )
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update task status");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update task status");
    }
  };

  const handleVerifyTask = async (task: Task) => {
    if (!isOwner) return;
    await handleStatusChange(task._id, "verified", currentUserName);
  };

  const handleDragStart = (task: Task) => {
    if (canModifyTask(task) || isOwner) {
      setDraggedTask(task);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      if (canChangeStatus(draggedTask, status)) {
        if (status === "verified") {
          handleStatusChange(draggedTask._id, status, currentUserName);
        } else {
          handleStatusChange(draggedTask._id, status);
        }
      }
    }
    setDraggedTask(null);
  };

  const openEditModal = (task: Task) => {
    if (!canModifyTask(task) && !isOwner) return;
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      assignedTo: task.assignedTo || "",
      assignedToName: task.assignedToName || "",
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase text-[#F0F4F2] tracking-tighter">
            Task Board
          </h3>
          <p className="text-[10px] font-black text-[var(--theme-accent)]/60 uppercase tracking-widest mt-1">
            {isOwner ? "Admin View - Full Access" : isAuthorized ? "Authorized - Can update assigned tasks" : "Team Member - Can update assigned tasks"}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filter by user */}
          <div className="flex items-center gap-2 bg-[var(--theme-card-alt)] rounded-xl p-1 border border-white/5">
            <Filter size={14} className="text-[var(--theme-accent)] ml-3" />
            <select
              value={filterByUser}
              onChange={(e) => setFilterByUser(e.target.value)}
              className="bg-transparent text-[#F0F4F2] text-xs font-bold py-2 pr-3 outline-none"
            >
              <option value="all">All Tasks</option>
              <option value="mine">My Tasks</option>
              {members.map((member) => (
                <option key={member.userEmail} value={member.userEmail}>
                  {member.userName}
                </option>
              ))}
            </select>
          </div>

          {isOwner && (
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
            >
              <Plus size={16} /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {columns.map((column) => {
          const columnTasks = filteredTasks.filter((t) => t.status === column.id);
          const Icon = column.icon;

          return (
            <div
              key={column.id}
              className="bg-[var(--theme-card)] rounded-[2rem] border border-white/5 overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div
                className="p-5 border-b border-white/5"
                style={{ borderTopColor: column.color, borderTopWidth: 3 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={16} style={{ color: column.color }} />
                    <span className="text-xs font-black uppercase tracking-widest text-[#F0F4F2]">
                      {column.title}
                    </span>
                  </div>
                  <span
                    className="px-2 py-1 rounded-full text-[10px] font-black"
                    style={{ backgroundColor: `${column.color}20`, color: column.color }}
                  >
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks */}
              <div className="p-3 space-y-3 min-h-[280px] max-h-[500px] overflow-y-auto no-scrollbar">
                <AnimatePresence>
                  {columnTasks.map((task) => {
                    const isMyTask = task.assignedTo === currentUserEmail;
                    const canDrag = canModifyTask(task) || isOwner;
                    
                    return (
                      <motion.div
                        key={task._id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        draggable={canDrag}
                        onDragStart={() => canDrag && handleDragStart(task)}
                        className={`bg-[var(--theme-card-alt)] p-4 rounded-xl border transition-all group ${
                          isMyTask 
                            ? "border-[var(--theme-accent)]/30 ring-1 ring-[var(--theme-accent)]/20" 
                            : "border-white/5"
                        } ${canDrag ? "cursor-grab active:cursor-grabbing hover:border-[var(--theme-accent)]/30" : "cursor-default"} ${
                          draggedTask?._id === task._id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {canDrag && (
                            <GripVertical
                              size={14}
                              className="text-white/20 mt-1 flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4
                                className={`font-bold text-[#F0F4F2] text-sm ${canDrag ? "cursor-pointer hover:text-[var(--theme-accent)]" : ""} transition-colors`}
                                onClick={() => canDrag && openEditModal(task)}
                              >
                                {task.title}
                              </h4>
                              <div className="flex items-center gap-1">
                                {/* Verify button for owner on completed tasks */}
                                {isOwner && task.status === "completed" && (
                                  <button
                                    onClick={() => handleVerifyTask(task)}
                                    className="opacity-0 group-hover:opacity-100 text-[#8B5CF6]/70 hover:text-[#8B5CF6] transition-all"
                                    title="Verify task"
                                  >
                                    <BadgeCheck size={16} />
                                  </button>
                                )}
                                {isOwner && (
                                  <button
                                    onClick={() => handleDeleteTask(task._id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-500/50 hover:text-red-500 transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {task.description && (
                              <p className="text-[11px] text-white/40 mt-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${priorityColors[task.priority]}`}
                              >
                                {task.priority}
                              </span>

                              {task.dueDate && (
                                <span className="flex items-center gap-1 text-[9px] text-white/40">
                                  <Calendar size={9} />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            {/* Assignee */}
                            {task.assignedToName && (
                              <div className={`flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg ${isMyTask ? "bg-[var(--theme-accent)]/10" : "bg-white/5"}`}>
                                <User size={10} className={isMyTask ? "text-[var(--theme-accent)]" : "text-white/40"} />
                                <span className={`text-[9px] font-bold ${isMyTask ? "text-[var(--theme-accent)]" : "text-white/40"}`}>
                                  {isMyTask ? "You" : task.assignedToName}
                                </span>
                              </div>
                            )}

                            {/* Verified badge */}
                            {task.status === "verified" && task.verifiedBy && (
                              <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg bg-[#8B5CF6]/10">
                                <Shield size={10} className="text-[#8B5CF6]" />
                                <span className="text-[9px] font-bold text-[#8B5CF6]">
                                  Verified by {task.verifiedBy}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-[9px] font-black uppercase tracking-widest text-white/10">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[var(--theme-background)]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--theme-card-alt)] rounded-[3rem] p-10 max-w-lg w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-[#F0F4F2] uppercase tracking-tighter">
                {editingTask ? "Edit Task" : "New Task"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
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
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  disabled={editingTask && !isOwner}
                  className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-bold placeholder:text-white/10 disabled:opacity-50"
                  placeholder="Task title..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-60">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-medium placeholder:text-white/10 resize-none"
                  placeholder="Task description or progress update..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-60">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: e.target.value as "low" | "medium" | "high",
                      }))
                    }
                    disabled={editingTask && !isOwner}
                    className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-bold disabled:opacity-50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-60">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                    disabled={editingTask && !isOwner}
                    className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-bold disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Only owner can assign tasks */}
              {isOwner && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-60">
                    Assign To
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => {
                      const selected = members.find(
                        (m) => m.userEmail === e.target.value
                      );
                      setFormData((prev) => ({
                        ...prev,
                        assignedTo: e.target.value,
                        assignedToName: selected?.userName || "",
                      }));
                    }}
                    className="w-full bg-[var(--theme-card)] border border-white/5 rounded-xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-bold"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.userEmail} value={member.userEmail}>
                        {member.userName} {member.role ? `(${member.role})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Show current assignee for non-owners */}
              {!isOwner && editingTask?.assignedToName && (
                <div className="p-4 bg-[var(--theme-card)] rounded-xl border border-white/5">
                  <span className="text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest opacity-60">
                    Assigned To
                  </span>
                  <p className="text-[#F0F4F2] font-bold mt-1">{editingTask.assignedToName}</p>
                </div>
              )}

              {/* Status change for assigned users */}
              {editingTask && canModifyTask(editingTask) && !isOwner && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-2 opacity-60">
                    Update Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["pending", "in-progress", "completed"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          handleStatusChange(editingTask._id, status);
                          setShowAddModal(false);
                          resetForm();
                        }}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          editingTask.status === status
                            ? "bg-[var(--theme-accent)] text-[var(--theme-background)]"
                            : "bg-[var(--theme-card)] text-white/40 hover:text-white border border-white/5"
                        }`}
                      >
                        {status.replace("-", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={editingTask ? handleUpdateTask : handleCreateTask}
                  disabled={loading || !formData.title.trim()}
                  className="flex-1 py-4 bg-[var(--theme-accent)] text-[var(--theme-background)] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : editingTask ? "Update" : "Create"}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-6 py-4 bg-white/5 text-[#F0F4F2]/40 font-black uppercase tracking-widest rounded-xl hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
