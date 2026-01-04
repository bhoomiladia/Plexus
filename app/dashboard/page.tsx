"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  TrendingUp,
  Plus,
  CheckCircle,
  Clock,
  Zap,
  Target,
  Calendar,
  ArrowRight,
  Sparkles,
  FolderOpen,
  Users,
  Bell,
  MessageSquare,
  X,
} from "lucide-react";

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pendingApplications: number;
  growthPercentage: number;
  ownedProjectsCount: number;
  participatingProjectsCount: number;
}

interface Recommendation {
  _id: string;
  title: string;
  description: string;
  matchScore: number;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectTitle: string | null;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  timestamp: string;
  link: string;
}

interface SkillAnalytics {
  userSkills: string[];
  coveragePercentage: number;
  topDemandedSkills: { skill: string; demand: number; userHas: boolean }[];
  recommendedSkills: { skill: string; demand: number }[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [skillAnalytics, setSkillAnalytics] = useState<SkillAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    dueDate: "",
    priority: "medium",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, recsRes, tasksRes, activityRes, skillsRes] =
          await Promise.all([
            fetch("/api/dashboard/stats"),
            fetch("/api/dashboard/recommendations"),
            fetch("/api/dashboard/tasks"),
            fetch("/api/dashboard/activity"),
            fetch("/api/dashboard/skills-analytics"),
          ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (recsRes.ok) {
          const recsData = await recsRes.json();
          setRecommendations(recsData.recommendations || []);
        }
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData.tasks || []);
        }
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivities(activityData.activities || []);
        }
        if (skillsRes.ok) setSkillAnalytics(await skillsRes.json());
      } catch (e) {
        console.error("Error fetching dashboard data:", e);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchDashboardData();
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
        setNewTask({ title: "", dueDate: "", priority: "medium" });
        setShowTaskModal(false);
      }
    } catch (e) {
      console.error("Error creating task:", e);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
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

  if (status === "loading" || loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1E2B2A]">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--theme-accent)]" />
      </div>
    );

  const quickActions = [
    {
      icon: FolderOpen,
      label: "New Project",
      href: "/dashboard/projects/create",
      color: "bg-[var(--theme-accent)]",
    },
    {
      icon: Users,
      label: "Find Projects",
      href: "/dashboard/projects/open",
      color: "bg-[var(--theme-muted)]",
    },
    {
      icon: MessageSquare,
      label: "Community",
      href: "/dashboard/community",
      color: "bg-[var(--theme-card-alt)]",
    },
    {
      icon: Bell,
      label: "Notifications",
      href: "/dashboard/notifications",
      color: "bg-[var(--theme-card-alt)]",
    },
  ];

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 min-h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3rem] p-10 overflow-y-auto no-scrollbar transition-all duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Top Row */}
        <div className="grid grid-cols-12 gap-6">
          {/* Main Profile Header */}
          <div className="col-span-7 bg-[var(--theme-muted)] rounded-[3.5rem] p-12 flex flex-col justify-center text-[#F0F4F2]">
            <h1 className="text-5xl font-black   leading-tight tracking-tighter uppercase">
              Hi, <br /> {session?.user?.name || "User"}!
            </h1>
            <p className="text-[var(--theme-accent)] font-bold tracking-widest text-sm mt-2 opacity-80 uppercase">
              {session?.user?.email || ""}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="col-span-5 bg-[var(--theme-card-alt)] rounded-[3.5rem] p-8 text-[#F0F4F2]">
            <span className="font-black text-xs uppercase tracking-[0.2em] text-[var(--theme-accent)] opacity-60">
              Quick Actions
            </span>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className={`${action.color} p-4 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-all border border-white/5`}
                >
                  <action.icon size={18} className="text-[var(--theme-accent)]" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#F0F4F2]">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-12 gap-6">
          {/* Growth Card */}
          <div className="col-span-3 bg-[var(--theme-accent)] rounded-[3.5rem] p-8 flex flex-col justify-center">
            <span className="text-[11px] font-black text-[var(--theme-card)] uppercase tracking-widest opacity-70">
              Growth
            </span>
            <h3 className="text-4xl font-black   text-[var(--theme-card)] mt-2">
              +{stats?.growthPercentage || 0}%
            </h3>
            <div className="flex items-center gap-1 text-xs font-bold text-[var(--theme-card)]/60 mt-3">
              <TrendingUp size={16} /> this week
            </div>
          </div>

          {/* Projects Count Card */}
          <div className="col-span-3 bg-[var(--theme-card-alt)] rounded-[3.5rem] p-8 flex flex-col justify-center border border-white/5">
            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--theme-accent)] opacity-60">
              Projects
            </span>
            <h3 className="text-4xl font-black   text-[#F0F4F2] mt-2">
              {stats?.totalProjects || 0}
            </h3>
            <p className="text-xs font-bold mt-3 text-[var(--theme-accent)]">
              {stats?.activeProjects || 0} Active
            </p>
          </div>

          {/* Active/View Details Card */}
          <div className="col-span-6 bg-[var(--theme-muted)] rounded-[3.5rem] p-8 flex items-center justify-between">
            <div>
              <p className="text-4xl font-black   text-[#F0F4F2] uppercase">
                {stats?.activeProjects || 0} Active
              </p>
              <p className="text-sm text-[var(--theme-accent)] mt-2">
                {stats?.completedProjects || 0} Completed •{" "}
                {stats?.pendingApplications || 0} Pending
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/projects")}
              className="px-6 py-4 bg-[var(--theme-card)] text-[var(--theme-accent)] rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-[var(--theme-accent)] hover:text-[var(--theme-card)] transition-all shadow-xl"
            >
              View Projects
            </button>
          </div>
        </div>

        {/* Main Content Row */}
        <div className="grid grid-cols-12 gap-6">
          {/* Tasks Section */}
          <div className="col-span-4 bg-[var(--theme-card-alt)] rounded-[3.5rem] p-8 border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <span className="font-black text-xs uppercase tracking-[0.2em] text-[var(--theme-accent)] opacity-60">
                My Tasks
              </span>
              <button
                onClick={() => setShowTaskModal(true)}
                className="w-8 h-8 bg-[var(--theme-accent)] rounded-xl flex items-center justify-center hover:scale-110 transition-all"
              >
                <Plus size={16} className="text-[var(--theme-card)]" />
              </button>
            </div>
            <div className="space-y-3 max-h-[280px] overflow-y-auto no-scrollbar">
              {tasks.length > 0 ? (
                tasks.slice(0, 5).map((task) => (
                  <div
                    key={task._id}
                    className={`p-4 rounded-2xl border border-white/5 flex items-start gap-3 transition-all ${
                      task.status === "completed"
                        ? "bg-white/5 opacity-60"
                        : "bg-[var(--theme-card)]"
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTask(task._id, task.status)}
                      className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        task.status === "completed"
                          ? "bg-[var(--theme-accent)] border-[var(--theme-accent)]"
                          : "border-[var(--theme-accent)]/40 hover:border-[var(--theme-accent)]"
                      }`}
                    >
                      {task.status === "completed" && (
                        <CheckCircle size={12} className="text-[var(--theme-card)]" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold text-[#F0F4F2] truncate ${
                          task.status === "completed" ? "line-through" : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="text-[10px] text-[var(--theme-accent)]/60 mt-1 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${
                        task.priority === "high"
                          ? "bg-red-500/20 text-red-400"
                          : task.priority === "medium"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto mb-3 text-[var(--theme-accent)]/30" size={32} />
                  <p className="text-xs text-[var(--theme-accent)]/60">No tasks yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="col-span-4 bg-[var(--theme-card-alt)] rounded-[3.5rem] p-8 border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <span className="font-black text-xs uppercase tracking-[0.2em] text-[var(--theme-accent)] opacity-60">
                Recommended Projects
              </span>
              {recommendations.length > 3 && (
                <button
                  onClick={() => router.push("/dashboard/recommendations")}
                  className="text-[10px] font-black uppercase tracking-wider text-[var(--theme-accent)] hover:text-[#F0F4F2] transition-colors"
                >
                  All →
                </button>
              )}
            </div>
            <div className="space-y-3 max-h-[280px] overflow-y-auto no-scrollbar">
              {recommendations.length > 0 ? (
                recommendations.slice(0, 4).map((rec) => (
                  <div
                    key={rec._id}
                    className="bg-[var(--theme-card)] p-4 rounded-2xl border border-white/5 hover:bg-white/5 transition-all cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/projects/${rec._id}`)
                    }
                  >
                    <p className="text-xs font-bold text-[#F0F4F2] line-clamp-1">
                      {rec.title}
                    </p>
                    {rec.matchScore > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-[var(--theme-card)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--theme-accent)] rounded-full"
                            style={{
                              width: `${Math.min(rec.matchScore, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--theme-accent)] font-bold">
                          {rec.matchScore}%
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Target
                    className="mx-auto mb-3 text-[var(--theme-accent)]/30"
                    size={32}
                  />
                  <p className="text-xs text-[var(--theme-accent)]/60">
                    No recommendations yet
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="col-span-4 bg-[var(--theme-card-alt)] rounded-[3.5rem] p-8 border border-white/5">
            <span className="font-black text-xs uppercase tracking-[0.2em] text-[var(--theme-accent)] opacity-60">
              Recent Activity
            </span>
            <div className="space-y-3 mt-6 max-h-[280px] overflow-y-auto no-scrollbar">
              {activities.length > 0 ? (
                activities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                    onClick={() => router.push(activity.link)}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        activity.type === "project"
                          ? "bg-[var(--theme-accent)]/20"
                          : activity.type === "application"
                            ? "bg-blue-500/20"
                            : "bg-yellow-500/20"
                      }`}
                    >
                      {activity.type === "project" ? (
                        <FolderOpen size={14} className="text-[var(--theme-accent)]" />
                      ) : activity.type === "application" ? (
                        <Users size={14} className="text-blue-400" />
                      ) : (
                        <Bell size={14} className="text-yellow-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-[#F0F4F2] truncate">
                        {activity.title}
                      </p>
                      <p className="text-[9px] text-[var(--theme-accent)]/60 mt-0.5">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Zap className="mx-auto mb-3 text-[var(--theme-accent)]/30" size={32} />
                  <p className="text-xs text-[var(--theme-accent)]/60">
                    No recent activity
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skills Analytics Row */}
        {skillAnalytics && (
          <div className="grid grid-cols-12 gap-6">
            {/* Skill Coverage */}
            <div className="col-span-4 bg-[var(--theme-muted)] rounded-[3.5rem] p-8">
              <span className="text-[11px] font-black text-[#F0F4F2] uppercase tracking-widest opacity-60">
                Skill Coverage
              </span>
              <div className="mt-4 flex items-end gap-4">
                <h3 className="text-5xl font-black   text-[#F0F4F2]">
                  {skillAnalytics.coveragePercentage}%
                </h3>
                <p className="text-xs text-[var(--theme-accent)] mb-2">
                  of demanded skills you have
                </p>
              </div>
              <div className="mt-4 h-2 bg-[var(--theme-card)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${skillAnalytics.coveragePercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-[var(--theme-accent)] rounded-full"
                />
              </div>
              <p className="text-[10px] text-[var(--theme-accent)]/60 mt-3">
                Based on {skillAnalytics.totalOpenProjects || 0} open projects
              </p>
            </div>

            {/* Top Demanded Skills */}
            <div className="col-span-4 bg-[var(--theme-card-alt)] rounded-[3.5rem] p-8 border border-white/5">
              <span className="font-black text-xs uppercase tracking-[0.2em] text-[var(--theme-accent)] opacity-60">
                Top Demanded Skills
              </span>
              <div className="mt-4 space-y-2">
                {skillAnalytics.topDemandedSkills.length > 0 ? (
                  skillAnalytics.topDemandedSkills
                    .slice(0, 5)
                    .map((skill, idx) => (
                      <div key={skill.skill} className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-[var(--theme-accent)]/40 w-4">
                          {idx + 1}
                        </span>
                        <span
                          className={`text-xs font-bold flex-1 capitalize ${
                            skill.userHas ? "text-[var(--theme-accent)]" : "text-[#F0F4F2]/60"
                          }`}
                        >
                          {skill.skill}
                        </span>
                        <span className="text-[9px] text-[var(--theme-accent)]/40">
                          {skill.demand} {skill.demand === 1 ? "project" : "projects"}
                        </span>
                        {skill.userHas && (
                          <CheckCircle size={12} className="text-[var(--theme-accent)]" />
                        )}
                      </div>
                    ))
                ) : (
                  <div className="text-center py-6">
                    <Target className="mx-auto mb-2 text-[var(--theme-accent)]/30" size={24} />
                    <p className="text-xs text-[var(--theme-accent)]/60">No skill data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Skills to Learn */}
            <div className="col-span-4 bg-[var(--theme-card-alt)] rounded-[3.5rem] p-8 border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} className="text-[var(--theme-accent)]" />
                <span className="font-black text-xs uppercase tracking-[0.2em] text-[var(--theme-accent)] opacity-60">
                  Skills to Learn
                </span>
              </div>
              <div className="space-y-2">
                {skillAnalytics.recommendedSkills.length > 0 ? (
                  skillAnalytics.recommendedSkills.slice(0, 4).map((skill) => (
                    <div
                      key={skill.skill}
                      className="flex items-center justify-between p-3 bg-[var(--theme-card)] rounded-xl border border-white/5"
                    >
                      <span className="text-xs font-bold text-[#F0F4F2] capitalize">
                        {skill.skill}
                      </span>
                      <span className="text-[10px] text-[var(--theme-accent)]/60">
                        {skill.demand} {skill.demand === 1 ? "project" : "projects"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="mx-auto mb-2 text-[var(--theme-accent)]/30" size={24} />
                    <p className="text-xs text-[var(--theme-accent)]/60">
                      {skillAnalytics.userSkills?.length > 0 
                        ? "You have all demanded skills!" 
                        : "Add skills to your profile"}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => router.push("/dashboard/profile")}
                className="mt-4 w-full py-3 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--theme-accent)] hover:text-[var(--theme-card)] transition-all flex items-center justify-center gap-2"
              >
                Update Skills <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowTaskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--theme-card-alt)] p-8 rounded-[2rem] w-full max-w-md border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black   text-[#F0F4F2] uppercase">
                  New Task
                </h3>
                <button
                  onClick={() => setShowTaskModal(false)}
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
                  className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[var(--theme-accent)] text-sm"
                />
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[var(--theme-accent)] text-sm"
                />
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, priority: e.target.value })
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[var(--theme-accent)] text-sm"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTask.title.trim()}
                  className="w-full py-4 bg-[var(--theme-accent)] text-[var(--theme-card)] rounded-xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
