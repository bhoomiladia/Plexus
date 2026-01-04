"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ShieldCheck,
  Users,
  Info,
  Star,
  X,
  Edit3,
  Plus,
  ClipboardList,
  UserCircle,
  LayoutGrid,
  Sparkles,
  Loader2,
  User,
  Target,
} from "lucide-react";
import KanbanBoard from "@/components/KanbanBoard";
import MilestoneSection from "@/components/MilestoneSection";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: string | null;
  assignedToName: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed" | "verified";
  dueDate: string | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

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

export default function ProjectManagePage() {
  const params = useParams();
  const { data: session } = useSession();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<"details" | "members" | "tasks">(
    "details"
  );
  const [project, setProject] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddAuthorizedModal, setShowAddAuthorizedModal] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({ email: "", roleId: "" });
  const [addAuthorizedEmail, setAddAuthorizedEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [addingAuthorized, setAddingAuthorized] = useState(false);
  const [showMatchedProfiles, setShowMatchedProfiles] = useState(false);
  const [matchedProfiles, setMatchedProfiles] = useState<MatchedProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [selectedRoleForMatch, setSelectedRoleForMatch] = useState<any>(null);
  const [shortlistingUser, setShortlistingUser] = useState<string | null>(null);
  const [activeTaskView, setActiveTaskView] = useState<"kanban" | "milestones">("kanban");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, tasksRes] = await Promise.all([
          fetch(`/api/project/${id}`),
          fetch(`/api/project/${id}/tasks`),
        ]);
        const projectData = await projectRes.json();
        const tasksData = await tasksRes.json();
        setProject(projectData.project);
        setApps(projectData.applications || []);
        setTasks(tasksData.tasks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const isOwner = useMemo(
    () => project?.ownerId === session?.user?.id,
    [project, session]
  );
  const acceptedMembers = useMemo(
    () => apps.filter((a) => a.status === "ACCEPTED"),
    [apps]
  );

  const handleCreateTaskFromSuggestion = useCallback(async (taskTitle: string) => {
    try {
      const res = await fetch(`/api/project/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: "",
          priority: "medium",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => [...prev, data.task]);
        setActiveTaskView("kanban");
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  }, [id]);

  const fetchMatchedProfiles = async (role: any) => {
    setSelectedRoleForMatch(role);
    setShowMatchedProfiles(true);
    setLoadingProfiles(true);
    try {
      const response = await fetch("/api/projects/match-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: [role] }),
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

  const handleShortlistUser = async (profile: MatchedProfile) => {
    if (!selectedRoleForMatch) return;
    
    setShortlistingUser(profile._id);
    try {
      const response = await fetch("/api/projects/shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          roleId: selectedRoleForMatch._id.toString(),
          userId: profile._id,
          userName: profile.name,
          userEmail: profile.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add to apps list
        setApps((prev) => [...prev, data.application]);
        // Remove from matched profiles
        setMatchedProfiles((prev) => prev.filter((p) => p._id !== profile._id));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to shortlist user");
      }
    } catch (error) {
      console.error("Error shortlisting user:", error);
      alert("Failed to shortlist user");
    } finally {
      setShortlistingUser(null);
    }
  };

  const handleUpdateStatus = async (
    appId: string,
    roleId: string,
    newStatus: string,
    appData?: any
  ) => {
    const res = await fetch(`/api/project/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, roleId, projectId: id }),
    });
    if (res.ok) {
      setApps((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status: newStatus } : a))
      );
      if (newStatus === "ACCEPTED") {
        setProject((prev: any) => ({
          ...prev,
          roles: prev.roles.map((r: any) =>
            r._id === roleId ? { ...r, filled: r.filled + 1 } : r
          ),
        }));

        // Add to Authorized Personnel if we have the app data
        if (appData) {
          try {
            const authRes = await fetch("/api/project/members/authorize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId: id,
                userEmail: appData.userEmail,
              }),
            });
            if (authRes.ok) {
              const data = await authRes.json();
              setProject((prev: any) => ({
                ...prev,
                authorizedPersonnel: [
                  ...(prev.authorizedPersonnel || []),
                  data.authorizedUser,
                ],
              }));
            }
          } catch (err) {
            console.error("Failed to add to authorized personnel:", err);
          }
        }
      }
    }
  };

  const handleInterview = async (app: any, role: any) => {
    // Send interview request to candidate
    try {
      const res = await fetch("/api/interview/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: app._id,
          projectId: id,
          roleId: role._id.toString(),
        }),
      });

      if (res.ok) {
        alert(`Interview request sent to ${app.userName}. They will be notified.`);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send interview request");
      }
    } catch (error) {
      console.error("Error sending interview request:", error);
      alert("Failed to send interview request");
    }
  };

  if (loading)
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex items-center justify-center">
        <div className="text-[var(--theme-accent)] font-black uppercase tracking-widest animate-pulse">
          Initializing Console...
        </div>
      </div>
    );

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <Link
              href="/dashboard/projects/manage"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-accent)] opacity-60 flex items-center gap-2 hover:opacity-100 transition-all"
            >
              <ArrowLeft size={14} /> Back to Ventures
            </Link>
            <h1 className="text-5xl font-black   uppercase text-[#F0F4F2] tracking-tighter leading-none">
              {project.title}
            </h1>
            <div className="flex items-center gap-3 text-[var(--theme-accent)]">
              {isOwner ? <ShieldCheck size={18} /> : <Users size={18} />}
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {isOwner
                  ? "Administrative Protocol Active"
                  : "Team Member Authorized"}
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            {isOwner && (
              <Link
                href={`/dashboard/projects/manage/${id}/edit`}
                className="p-4 bg-[var(--theme-card-alt)] text-[var(--theme-accent)] rounded-2xl border border-white/5 hover:bg-[var(--theme-muted)] transition-all"
              >
                <Edit3 size={20} />
              </Link>
            )}
            <div className="flex p-1.5 bg-[var(--theme-card-alt)] rounded-[2rem] border border-white/5">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "details" ? "bg-[var(--theme-accent)] text-[var(--theme-background)]" : "text-[#F0F4F2]/40"}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "tasks" ? "bg-[var(--theme-accent)] text-[var(--theme-background)]" : "text-[#F0F4F2]/40"}`}
              >
                <LayoutGrid size={14} /> Tasks
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "members" ? "bg-[var(--theme-accent)] text-[var(--theme-background)]" : "text-[#F0F4F2]/40"}`}
              >
                Personnel
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "details" ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-12 gap-8"
            >
              <div className="col-span-8 bg-[var(--theme-card-alt)] p-12 rounded-[3.5rem] border border-white/5">
                <h3 className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                  <Info size={16} /> Briefing
                </h3>
                <p className="text-[#F0F4F2] text-xl font-medium leading-relaxed   opacity-80">
                  {project.description}
                </p>
              </div>

              <div className="col-span-4 bg-[var(--theme-muted)] p-12 rounded-[3.5rem] flex flex-col justify-center text-[#F0F4F2]">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">
                  Team Size
                </span>
                <h2 className="text-6xl font-black  ">
                  {acceptedMembers.length + 1}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-accent)] mt-4">
                  Active Contributors
                </p>
              </div>
            </motion.div>
          ) : activeTab === "tasks" ? (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Task View Toggle */}
              <div className="flex items-center gap-2 p-1.5 bg-[var(--theme-card-alt)] rounded-2xl border border-white/5 w-fit">
                <button
                  onClick={() => setActiveTaskView("kanban")}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    activeTaskView === "kanban"
                      ? "bg-[var(--theme-accent)] text-[var(--theme-background)]"
                      : "text-[#F0F4F2]/40 hover:text-[#F0F4F2]"
                  }`}
                >
                  <LayoutGrid size={14} /> Kanban Board
                </button>
                <button
                  onClick={() => setActiveTaskView("milestones")}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    activeTaskView === "milestones"
                      ? "bg-[var(--theme-accent)] text-[var(--theme-background)]"
                      : "text-[#F0F4F2]/40 hover:text-[#F0F4F2]"
                  }`}
                >
                  <Target size={14} /> Milestones
                </button>
              </div>

              {activeTaskView === "kanban" ? (
                <KanbanBoard
                  projectId={id}
                  tasks={tasks}
                  members={[
                    ...(isOwner && session?.user?.email
                      ? [
                          {
                            userName:
                              session.user.name || project.ownerName || "Owner",
                            userEmail: session.user.email,
                            role: "Owner",
                          },
                        ]
                      : []),
                    ...acceptedMembers.map((app: any) => ({
                      userName: app.userName,
                      userEmail: app.userEmail,
                      role:
                        project.roles?.find(
                          (r: any) => r._id.toString() === app.roleId
                        )?.roleName || "Member",
                    })),
                    ...(project.authorizedPersonnel || []).map((p: any) => ({
                      userName: p.userName,
                      userEmail: p.userEmail,
                      role: "Authorized",
                    })),
                  ]}
                  isOwner={isOwner}
                  currentUserEmail={session?.user?.email || ""}
                  currentUserName={session?.user?.name || ""}
                  isAuthorized={(project.authorizedPersonnel || []).some(
                    (p: any) => p.userEmail === session?.user?.email
                  )}
                  isTeamMember={acceptedMembers.some(
                    (app: any) => app.userEmail === session?.user?.email
                  )}
                  onTasksChange={setTasks}
                />
              ) : (
                <MilestoneSection
                  projectId={id}
                  projectTitle={project.title}
                  projectDescription={project.description}
                  tasks={tasks}
                  teamSize={acceptedMembers.length + 1}
                  isOwner={isOwner}
                  onCreateTaskFromSuggestion={handleCreateTaskFromSuggestion}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="members"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* Active Team Section */}
              <section className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <h3 className="text-2xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
                    Team Members
                  </h3>
                  {isOwner && (
                    <button
                      onClick={() => setShowAddMemberModal(true)}
                      className="p-3 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-xl hover:scale-110 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {acceptedMembers.map((app: any) => (
                    <div
                      key={app._id}
                      className="p-8 bg-[var(--theme-card-alt)] rounded-[2.5rem] border border-[var(--theme-accent)]/20 relative group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="p-3 bg-[var(--theme-card)] rounded-2xl text-[var(--theme-accent)]">
                          <UserCircle size={24} />
                        </div>
                        <div>
                          <p className="font-black   text-[#F0F4F2] uppercase tracking-tight">
                            {app.userName}
                          </p>
                          <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-widest">
                            {project.roles.find(
                              (r: any) => r._id.toString() === app.roleId
                            )?.roleName || "Specialist"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Authorized Personnel Section */}
              <section className="space-y-6 pt-10 border-t border-white/5">
                <div className="flex justify-between items-center px-4">
                  <h3 className="text-2xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
                    Authorized Personnel
                  </h3>
                  {isOwner && (
                    <button
                      onClick={() => setShowAddAuthorizedModal(true)}
                      className="p-3 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-xl hover:scale-110 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </div>
                <p className="text-[10px] font-black text-[var(--theme-accent)]/60 uppercase tracking-widest px-4">
                  Users with direct access to view project and chat
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(project.authorizedPersonnel || []).length === 0 ? (
                    <div className="col-span-3 p-8 bg-[var(--theme-card-alt)] rounded-[2.5rem] border border-white/5 text-center">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                        No authorized personnel added
                      </p>
                    </div>
                  ) : (
                    project.authorizedPersonnel.map(
                      (person: any, index: number) => (
                        <div
                          key={person.userEmail || index}
                          className="p-8 bg-[var(--theme-card-alt)] rounded-[2.5rem] border border-[var(--theme-muted)]/30 relative group"
                        >
                          <div className="flex items-center gap-5">
                            <div className="p-3 bg-[var(--theme-card)] rounded-2xl text-[var(--theme-muted)]">
                              <ShieldCheck size={24} />
                            </div>
                            <div className="flex-1">
                              <p className="font-black   text-[#F0F4F2] uppercase tracking-tight">
                                {person.userName}
                              </p>
                              <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-widest">
                                {person.userEmail}
                              </p>
                            </div>
                            {isOwner && (
                              <button
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      `Remove ${person.userName} from authorized personnel?`
                                    )
                                  )
                                    return;
                                  try {
                                    const res = await fetch(
                                      `/api/project/members/authorize?projectId=${id}&userEmail=${encodeURIComponent(person.userEmail)}`,
                                      { method: "DELETE" }
                                    );
                                    if (res.ok) {
                                      setProject((prev: any) => ({
                                        ...prev,
                                        authorizedPersonnel:
                                          prev.authorizedPersonnel.filter(
                                            (p: any) =>
                                              p.userEmail !== person.userEmail
                                          ),
                                      }));
                                    } else {
                                      alert("Failed to remove authorized user");
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    alert("Failed to remove authorized user");
                                  }
                                }}
                                className="p-2 text-red-500/50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </section>

              {/* Recruitment Funnel Section */}
              {isOwner && (
                <section className="pt-10 border-t border-white/5 space-y-10">
                  <h3 className="text-2xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
                    Recruitment Pipeline
                  </h3>
                  <div className="space-y-8">
                    {project.roles.map((role: any) => (
                      <div
                        key={role._id}
                        className="bg-[var(--theme-card)] p-10 rounded-[3.5rem] border border-white/5"
                      >
                        <div className="flex justify-between items-center mb-10 px-4">
                          <div>
                            <h4 className="text-3xl font-black   text-[#F0F4F2] uppercase tracking-tighter">
                              {role.roleName}
                            </h4>
                            <span className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-60">
                              Fulfillment Status
                            </span>
                          </div>
                          <div className="flex items-center gap-6">
                            <button
                              onClick={() => fetchMatchedProfiles(role)}
                              className="flex items-center gap-2 px-6 py-3 bg-[var(--theme-muted)] text-[#F0F4F2] rounded-2xl hover:bg-[var(--theme-accent)] hover:text-[var(--theme-card)] transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <Sparkles size={14} /> Find Matches
                            </button>
                            <div className="text-right">
                              <span className="text-4xl font-black   text-[var(--theme-accent)]">
                                {role.filled} / {role.needed}
                              </span>
                              <p className="text-[9px] font-black text-[#F0F4F2]/30 uppercase tracking-widest">
                                Units Allocated
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <StatusCol
                            title="Shortlisted"
                            icon={<Star size={14} />}
                            status="SHORTLISTED"
                            apps={apps}
                            role={role}
                            onUpdate={handleUpdateStatus}
                            onInterview={handleInterview}
                          />
                          <StatusCol
                            title="Inbound Requests"
                            icon={<ClipboardList size={14} />}
                            status="PENDING"
                            apps={apps}
                            role={role}
                            onUpdate={handleUpdateStatus}
                            onInterview={handleInterview}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Add Member Modal - UNIRIVO Dark Styled */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-[var(--theme-background)]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--theme-card-alt)] rounded-[3.5rem] p-12 max-w-md w-full border border-white/10 shadow-2xl"
          >
            <h2 className="text-3xl font-black   text-[#F0F4F2] uppercase tracking-tighter mb-8">
              Deploy Specialist
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!addMemberForm.email || !addMemberForm.roleId) return;
                setAddingMember(true);
                try {
                  const res = await fetch("/api/project/members/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      projectId: id,
                      roleId: addMemberForm.roleId,
                      userEmail: addMemberForm.email,
                    }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setApps((prev) => [...prev, data.application]);
                    setProject((prev: any) => ({
                      ...prev,
                      roles: prev.roles.map((r: any) =>
                        r._id.toString() === addMemberForm.roleId
                          ? { ...r, filled: r.filled + 1 }
                          : r
                      ),
                    }));
                    setShowAddMemberModal(false);
                    setAddMemberForm({ email: "", roleId: "" });
                  } else {
                    alert(data.message || "Failed to add member");
                  }
                } catch (err) {
                  console.error(err);
                  alert("Failed to add member");
                } finally {
                  setAddingMember(false);
                }
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-3 opacity-60">
                  Select Role
                </label>
                <select
                  required
                  value={addMemberForm.roleId}
                  onChange={(e) =>
                    setAddMemberForm((prev) => ({
                      ...prev,
                      roleId: e.target.value,
                    }))
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 rounded-2xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-bold"
                >
                  <option value="">Choose a role...</option>
                  {project.roles
                    .filter((r: any) => r.filled < r.needed)
                    .map((role: any) => (
                      <option key={role._id} value={role._id.toString()}>
                        {role.roleName} ({role.filled}/{role.needed} filled)
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-3 opacity-60">
                  Identity Email
                </label>
                <input
                  required
                  type="email"
                  value={addMemberForm.email}
                  onChange={(e) =>
                    setAddMemberForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full bg-[var(--theme-card)] border border-white/5 rounded-2xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-bold placeholder:text-white/10"
                  placeholder="user@UNIRIVO.io"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={addingMember}
                  className="flex-1 py-5 bg-[var(--theme-accent)] text-[var(--theme-background)] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingMember ? "Adding..." : "Authorize"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setAddMemberForm({ email: "", roleId: "" });
                  }}
                  className="px-6 py-5 bg-white/5 text-[#F0F4F2]/40 font-black uppercase tracking-widest rounded-2xl hover:text-white transition-all"
                >
                  Abort
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Authorized Personnel Modal */}
      {showAddAuthorizedModal && (
        <div className="fixed inset-0 bg-[var(--theme-background)]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--theme-card-alt)] rounded-[3.5rem] p-12 max-w-md w-full border border-white/10 shadow-2xl"
          >
            <h2 className="text-3xl font-black   text-[#F0F4F2] uppercase tracking-tighter mb-4">
              Add Authorized Personnel
            </h2>
            <p className="text-[10px] font-black text-[var(--theme-accent)]/60 uppercase tracking-widest mb-8">
              Grant direct access to view project and chat
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!addAuthorizedEmail) return;
                setAddingAuthorized(true);
                try {
                  const res = await fetch("/api/project/members/authorize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      projectId: id,
                      userEmail: addAuthorizedEmail,
                    }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setProject((prev: any) => ({
                      ...prev,
                      authorizedPersonnel: [
                        ...(prev.authorizedPersonnel || []),
                        data.authorizedUser,
                      ],
                    }));
                    setShowAddAuthorizedModal(false);
                    setAddAuthorizedEmail("");
                  } else {
                    alert(data.message || "Failed to authorize user");
                  }
                } catch (err) {
                  console.error(err);
                  alert("Failed to authorize user");
                } finally {
                  setAddingAuthorized(false);
                }
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-3 opacity-60">
                  User Email
                </label>
                <input
                  required
                  type="email"
                  value={addAuthorizedEmail}
                  onChange={(e) => setAddAuthorizedEmail(e.target.value)}
                  className="w-full bg-[var(--theme-card)] border border-white/5 rounded-2xl p-4 text-[#F0F4F2] focus:ring-2 focus:ring-[var(--theme-accent)] outline-none transition-all font-bold placeholder:text-white/10"
                  placeholder="user@example.com"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={addingAuthorized}
                  className="flex-1 py-5 bg-[var(--theme-accent)] text-[var(--theme-background)] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingAuthorized ? "Adding..." : "Authorize"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAuthorizedModal(false);
                    setAddAuthorizedEmail("");
                  }}
                  className="px-6 py-5 bg-white/5 text-[#F0F4F2]/40 font-black uppercase tracking-widest rounded-2xl hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Matched Profiles Modal */}
      <AnimatePresence>
        {showMatchedProfiles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowMatchedProfiles(false)}
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
                      <Sparkles size={28} className="text-[var(--theme-card)]" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black uppercase text-[#F0F4F2] tracking-tighter">
                        Matched Profiles
                      </h2>
                      <p className="text-[var(--theme-accent)] text-sm font-bold mt-1">
                        For {selectedRoleForMatch?.roleName || "Role"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMatchedProfiles(false)}
                    className="p-3 bg-[var(--theme-card-alt)] hover:bg-[var(--theme-muted)] rounded-xl text-[var(--theme-accent)] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(85vh-180px)]">
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
                      No profiles match the required skills for this role
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

                              {profile.matchedSkills.length > 0 && (
                                <div className="mb-3">
                                  <span className="text-[8px] font-black uppercase text-[var(--theme-accent)] tracking-widest opacity-50 block mb-2">
                                    Matched Skills
                                  </span>
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
                                </div>
                              )}

                              {profile.missingSkills.length > 0 && (
                                <div className="mb-3">
                                  <span className="text-[8px] font-black uppercase text-red-400/60 tracking-widest opacity-50 block mb-2">
                                    Missing Skills
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {profile.missingSkills.slice(0, 3).map((skill, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-red-500/10 text-red-400/60 text-[9px] font-bold rounded-lg"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {profile.missingSkills.length > 3 && (
                                      <span className="px-2 py-1 text-red-400/30 text-[9px] font-bold">
                                        +{profile.missingSkills.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* View Profile Button */}
                              <div className="flex gap-2">
                                <Link
                                  href={`/dashboard/profile/${profile._id}`}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--theme-card)] text-[var(--theme-accent)] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[var(--theme-muted)] transition-all border border-white/5"
                                >
                                  <UserCircle size={14} /> View Profile
                                </Link>
                                <button
                                  onClick={() => handleShortlistUser(profile)}
                                  disabled={shortlistingUser === profile._id}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-card)] text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {shortlistingUser === profile._id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Star size={14} />
                                  )}
                                  Shortlist
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5">
                <button
                  onClick={() => setShowMatchedProfiles(false)}
                  className="w-full py-4 bg-[var(--theme-card-alt)] text-[var(--theme-accent)] font-black uppercase tracking-widest rounded-2xl hover:bg-[var(--theme-muted)] transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusCol({ title, icon, status, apps, role, onUpdate, onInterview }: any) {
  const filtered = apps.filter(
    (a: any) => a.roleId === role._id.toString() && a.status === status
  );
  return (
    <div className="space-y-6">
      <h5 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-accent)] opacity-50 px-4">
        {icon} {title}
      </h5>
      <div className="space-y-4 p-6 bg-[var(--theme-card-alt)] rounded-[2.5rem] border border-white/5 min-h-[160px]">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-[9px] font-black uppercase tracking-widest text-white/5">
            Queue Empty
          </div>
        ) : (
          filtered.map((app: any) => (
            <div
              key={app._id}
              className="bg-[var(--theme-card)] p-6 rounded-[2rem] border border-white/5 group hover:border-[var(--theme-accent)]/30 transition-all"
            >
              <p className="font-black text-[#F0F4F2] uppercase tracking-tight mb-1">
                {app.userName}
              </p>
              <p className="text-[var(--theme-accent)]/50 text-[9px] mb-4 truncate">
                {app.userEmail}
              </p>
              <div className="flex gap-2">
                {status === "PENDING" && (
                  <>
                    <button
                      onClick={() => onInterview(app, role)}
                      className="flex-1 py-2 bg-[var(--theme-muted)] text-[#F0F4F2] text-[9px] font-black uppercase rounded-lg hover:bg-[#4a6b67] transition-all flex items-center justify-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                      Interview
                    </button>
                    <button
                      onClick={() => onUpdate(app._id, role._id, "ACCEPTED", app)}
                      className="flex-1 py-2 bg-[var(--theme-accent)] text-[var(--theme-background)] text-[9px] font-black uppercase rounded-lg hover:scale-105 transition-all"
                    >
                      Accept
                    </button>
                  </>
                )}
                {status === "SHORTLISTED" && (
                  <>
                    <button
                      onClick={() => onInterview(app, role)}
                      className="flex-1 py-2 bg-[var(--theme-muted)] text-[#F0F4F2] text-[9px] font-black uppercase rounded-lg hover:bg-[#4a6b67] transition-all flex items-center justify-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                      Interview
                    </button>
                    <button
                      onClick={() => onUpdate(app._id, role._id, "ACCEPTED", app)}
                      className="flex-1 py-2 bg-[var(--theme-accent)] text-[var(--theme-background)] text-[9px] font-black uppercase rounded-lg"
                    >
                      Accept
                    </button>
                  </>
                )}
                <button
                  onClick={() => onUpdate(app._id, role._id, "REJECTED")}
                  className="px-4 py-2 text-red-500/50 hover:text-red-500 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
