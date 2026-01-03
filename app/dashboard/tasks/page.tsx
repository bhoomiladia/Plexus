"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Plus,
  CheckCircle,
  Clock,
  Calendar,
  Trash2,
  Filter,
  Search,
  X,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string | null;
  projectTitle: string | null;
  createdAt: string;
}

export default function TasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/dashboard/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error("Error fetching tasks:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchTasks();
  }, [session]);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      const res = await fetch("/api/dashboard/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks([data.task, ...tasks]);
        setNewTask({
          title: "",
          description: "",
          dueDate: "",
          priority: "medium",
        });
        setShowModal(false);
      }
    } catch (e) {
      console.error("Error creating task:", e);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    try {
      await fetch("/api/dashboard/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: editingTask._id,
          title: editingTask.title,
          description: editingTask.description,
          dueDate: editingTask.dueDate,
          priority: editingTask.priority,
        }),
      });
      setTasks(tasks.map((t) => (t._id === editingTask._id ? editingTask : t)));
      setEditingTask(null);
    } catch (e) {
      console.error("Error updating task:", e);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      await fetch("/api/dashboard/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      });
      setTasks(
        tasks.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (e) {
      console.error("Error updating task:", e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/dashboard/tasks?taskId=${taskId}`, {
        method: "DELETE",
      });
      setTasks(tasks.filter((t) => t._id !== taskId));
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  };

  const filteredTasks = tasks
    .filter((task) => {
      if (filter === "pending") return task.status !== "completed";
      if (filter === "completed") return task.status === "completed";
      return true;
    })
    .filter(
      (task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const pendingCount = tasks.filter((t) => t.status !== "completed").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const overdueTasks = tasks.filter(
    (t) =>
      t.status !== "completed" && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  if (status === "loading" || loading) {
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[#1A2323] rounded-[3.5rem] flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-[#88AB8E]" />
      </div>
    );
  }

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 min-h-[calc(100vh-120px)] bg-[#1A2323] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-5xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
              My Tasks
            </h1>
            <p className="text-[#88AB8E] font-bold tracking-[0.2em] text-[10px] uppercase opacity-60 mt-2">
              Stay organized and productive
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-8 py-4 bg-[#88AB8E] text-[#1A2323] rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
          >
            <Plus size={16} /> New Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#243131] p-6 rounded-[2rem] border border-white/5">
            <p className="text-[9px] font-black text-[#88AB8E] uppercase tracking-widest opacity-50">
              Total
            </p>
            <p className="text-3xl font-black text-[#F0F4F2] mt-1">
              {tasks.length}
            </p>
          </div>
          <div className="bg-[#243131] p-6 rounded-[2rem] border border-white/5">
            <p className="text-[9px] font-black text-[#88AB8E] uppercase tracking-widest opacity-50">
              Pending
            </p>
            <p className="text-3xl font-black text-yellow-400 mt-1">
              {pendingCount}
            </p>
          </div>
          <div className="bg-[#243131] p-6 rounded-[2rem] border border-white/5">
            <p className="text-[9px] font-black text-[#88AB8E] uppercase tracking-widest opacity-50">
              Completed
            </p>
            <p className="text-3xl font-black text-green-400 mt-1">
              {completedCount}
            </p>
          </div>
          <div className="bg-[#243131] p-6 rounded-[2rem] border border-white/5">
            <p className="text-[9px] font-black text-[#88AB8E] uppercase tracking-widest opacity-50">
              Overdue
            </p>
            <p className="text-3xl font-black text-red-400 mt-1">
              {overdueTasks}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-white/5 pb-6">
          <div className="flex gap-4">
            {(["all", "pending", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f
                    ? "bg-[#88AB8E] text-[#1A2323]"
                    : "bg-[#243131] text-[#88AB8E] hover:bg-[#88AB8E]/20"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#88AB8E]/40"
              size={14}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-[#243131] border border-white/5 rounded-xl text-[10px] font-bold text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[#88AB8E] transition-all placeholder:text-white/20 uppercase tracking-widest"
              placeholder="Search tasks..."
            />
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 bg-[#243131]/30 rounded-[2rem] border border-dashed border-white/10">
              <AlertCircle
                className="mx-auto mb-4 text-[#F0F4F2]/20"
                size={48}
              />
              <p className="text-[#F0F4F2]/30 font-bold uppercase tracking-widest text-xs">
                No tasks found
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <motion.div
                key={task._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-[#243131] p-6 rounded-[2rem] border border-white/5 flex items-center gap-4 group hover:border-[#88AB8E]/20 transition-all ${
                  task.status === "completed" ? "opacity-60" : ""
                }`}
              >
                <button
                  onClick={() => handleToggleStatus(task._id, task.status)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    task.status === "completed"
                      ? "bg-[#88AB8E] border-[#88AB8E]"
                      : "border-[#88AB8E]/40 hover:border-[#88AB8E]"
                  }`}
                >
                  {task.status === "completed" && (
                    <CheckCircle size={14} className="text-[#1A2323]" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-bold text-[#F0F4F2] ${
                      task.status === "completed" ? "line-through" : ""
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-[#88AB8E]/60 mt-1 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    {task.dueDate && (
                      <span
                        className={`text-[10px] flex items-center gap-1 ${
                          new Date(task.dueDate) < new Date() &&
                          task.status !== "completed"
                            ? "text-red-400"
                            : "text-[#88AB8E]/60"
                        }`}
                      >
                        <Calendar size={10} />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {task.projectTitle && (
                      <span className="text-[10px] text-[#88AB8E]/60">
                        📁 {task.projectTitle}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg ${
                    task.priority === "high"
                      ? "bg-red-500/20 text-red-400"
                      : task.priority === "medium"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {task.priority}
                </span>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => setEditingTask(task)}
                    className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <ChevronDown size={14} className="text-[#88AB8E]" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#243131] p-8 rounded-[2rem] w-full max-w-lg border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black   text-[#F0F4F2] uppercase">
                  New Task
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <X size={16} className="text-[#F0F4F2]" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Task title..."
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="w-full bg-[#1A2323] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[#88AB8E]"
                />
                <textarea
                  placeholder="Description (optional)..."
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="w-full bg-[#1A2323] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[#88AB8E] min-h-[100px]"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    className="w-full bg-[#1A2323] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[#88AB8E]"
                  />
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                    className="w-full bg-[#1A2323] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[#88AB8E]"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTask.title.trim()}
                  className="w-full py-4 bg-[#88AB8E] text-[#1A2323] rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setEditingTask(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#243131] p-8 rounded-[2rem] w-full max-w-lg border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black   text-[#F0F4F2] uppercase">
                  Edit Task
                </h3>
                <button
                  onClick={() => setEditingTask(null)}
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <X size={16} className="text-[#F0F4F2]" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Task title..."
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                  className="w-full bg-[#1A2323] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[#88AB8E]"
                />
                <textarea
                  placeholder="Description (optional)..."
                  value={editingTask.description || ""}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-[#1A2323] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[#88AB8E] min-h-[100px]"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={editingTask.dueDate?.split("T")[0] || ""}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        dueDate: e.target.value,
                      })
                    }
                    className="w-full bg-[#1A2323] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[#88AB8E]"
                  />
                  <select
                    value={editingTask.priority}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        priority: e.target.value,
                      })
                    }
                    className="w-full bg-[#1A2323] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[#88AB8E]"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                <button
                  onClick={handleUpdateTask}
                  className="w-full py-4 bg-[#88AB8E] text-[#1A2323] rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
