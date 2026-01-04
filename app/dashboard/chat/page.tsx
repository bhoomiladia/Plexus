"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Hash, Loader2, Users } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
interface Project {
  _id: string;
  title: string;
  ownerId: string;
  memberCount: number;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

interface Message {
  _id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
  isOwner: boolean;
}

export default function ChatPage() {
  const { user, isLoading: authLoading } = useCurrentUser();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Authentication Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch Channels
  useEffect(() => {
    if (!user) return;

    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/chat/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects);
          if (data.projects.length > 0 && !activeProjectId) {
            setActiveProjectId(data.projects[0]._id);
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  // Messages Fetching & Polling
  const fetchMessages = async (projectId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchMembers = async (projectId: string) => {
    try {
      const res = await fetch(`/api/chat/members?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  useEffect(() => {
    if (activeProjectId) {
      fetchMessages(activeProjectId);
      fetchMembers(activeProjectId);

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(activeProjectId);
      }, 3000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activeProjectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeProjectId || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProjectId,
          content: input.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data.message]);
        setInput("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const activeProject = projects.find((p) => p._id === activeProjectId);

  if (authLoading || loading) {
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex items-center justify-center border border-white/5">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--theme-accent)]" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex items-center justify-center border border-white/5 shadow-2xl">
        <div className="text-center max-w-md px-10">
          <div className="w-24 h-24 mx-auto mb-8 rounded-[2rem] bg-[var(--theme-card-alt)] border border-white/5 flex items-center justify-center">
            <Hash className="w-12 h-12 text-[var(--theme-accent)]" />
          </div>
          <h2 className="text-3xl font-black   uppercase text-[#F0F4F2] tracking-tighter mb-4">
            No Transmissions
          </h2>
          <p className="text-[var(--theme-accent)] font-bold tracking-[0.2em] text-[10px] uppercase opacity-60 mb-8 leading-relaxed">
            Initialize your first project to enable secure team communications.
          </p>
          <button
            onClick={() => router.push("/dashboard/projects/manage")}
            className="px-10 py-5 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:scale-105 transition-all shadow-xl"
          >
            Create Venture
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex overflow-hidden border border-white/5 shadow-2xl transition-all duration-500">
      {/* CHANNEL SIDEBAR */}
      <aside className="w-80 bg-[var(--theme-card-alt)] border-r border-white/5 flex flex-col">
        <div className="p-10 border-b border-white/5">
          <h1 className="text-2xl font-black   uppercase text-[#F0F4F2] tracking-tighter leading-none">
            Channels
          </h1>
          <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-[0.3em] mt-3 opacity-60">
            {projects.length} Secure Uplinks
          </p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-4 space-y-2">
          {projects.map((project) => (
            <button
              key={project._id}
              onClick={() => setActiveProjectId(project._id)}
              className={`w-full text-left p-5 rounded-[2rem] transition-all duration-300 group flex flex-col gap-1 ${
                activeProjectId === project._id
                  ? "bg-[var(--theme-accent)] text-[var(--theme-background)] shadow-lg"
                  : "text-[#F0F4F2]/40 hover:bg-white/5 hover:text-[#F0F4F2]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Hash
                  size={16}
                  className={
                    activeProjectId === project._id
                      ? "text-[var(--theme-background)]"
                      : "text-[var(--theme-accent)]/40"
                  }
                />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] truncate">
                  {project.title}
                </span>
              </div>
              {project.lastMessage && activeProjectId !== project._id && (
                <p className="text-[9px] opacity-40   line-clamp-1 ml-7">
                  {project.lastMessage.content}
                </p>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* CHAT INTERFACE */}
      <main className="flex-1 flex flex-col bg-[var(--theme-card)]">
        {/* Chat Header */}
        <header className="p-10 flex justify-between items-center border-b border-white/5 bg-[var(--theme-card-alt)]/10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-[1.2rem] bg-[var(--theme-card-alt)] border border-white/5 flex items-center justify-center text-[var(--theme-accent)] shadow-xl">
              <Hash size={24} />
            </div>
            <div>
              <h2 className="text-4xl font-black   uppercase text-[#F0F4F2] tracking-tighter leading-tight">
                {activeProject?.title}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <Users size={12} className="text-[var(--theme-accent)]" />
                <span className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-[0.2em] opacity-60">
                  {members.length} Units Authorized
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="px-6 py-3 bg-[var(--theme-card-alt)] text-[var(--theme-accent)] rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2 hover:bg-[var(--theme-accent)] hover:text-[var(--theme-background)] transition-all border border-white/5"
          >
            <Users size={14} />
            {showMembers ? "Hide" : "Show"} Members
          </button>
        </header>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-12 space-y-8 no-scrollbar scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-[var(--theme-card-alt)] border border-white/5 flex items-center justify-center mb-6 opacity-30">
                <Hash size={32} className="text-[var(--theme-accent)]" />
              </div>
              <h3 className="text-xl font-black   uppercase text-[#F0F4F2]/30 tracking-widest">
                Channel Standby
              </h3>
              <p className="text-[10px] font-bold text-[var(--theme-accent)]/20 uppercase tracking-[0.3em] mt-2 text-center max-w-xs leading-relaxed">
                Transmit your first message to initiate team synchronization
                protocol
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.id;
              return (
                <motion.div
                  initial={{ opacity: 0, x: isMe ? 30 : -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={m._id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md p-6 rounded-[2.5rem] shadow-2xl relative transition-all ${
                      isMe
                        ? "bg-[var(--theme-muted)] text-[#F0F4F2] rounded-tr-none border border-[var(--theme-accent)]/20"
                        : "bg-[var(--theme-card-alt)] text-[#F0F4F2] rounded-tl-none border border-white/5"
                    }`}
                  >
                    {!isMe && (
                      <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-widest mb-3 opacity-60">
                        {m.senderName} // Specialist
                      </p>
                    )}
                    <p className="text-sm font-medium leading-relaxed   opacity-90 whitespace-pre-wrap break-words">
                      {m.content}
                    </p>
                    <p
                      className={`text-[8px] font-black uppercase tracking-widest mt-4 opacity-30 ${isMe ? "text-right" : "text-left"}`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Control */}
        <div className="p-10 border-t border-white/5 bg-[var(--theme-card-alt)]/20">
          <div className="relative flex items-center gap-6 bg-[var(--theme-card)] p-3 rounded-[3rem] border border-white/5 shadow-inner transition-all focus-within:ring-2 focus-within:ring-[var(--theme-accent)]/30">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
              className="flex-1 bg-transparent px-8 py-4 text-[#F0F4F2] text-sm font-bold outline-none placeholder:text-white/10 uppercase tracking-widest"
              placeholder={`Transmit Signal to #${activeProject?.title}...`}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="bg-[var(--theme-accent)] text-[var(--theme-background)] p-5 rounded-full hover:scale-110 transition-all shadow-xl disabled:opacity-20 active:scale-95 group"
            >
              {sending ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Send
                  size={24}
                  className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                />
              )}
            </button>
          </div>
          <div className="flex justify-between items-center mt-4 px-8">
            <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-[0.3em] opacity-40">
              Secure Uplink Active // E2E Encrypted
            </p>
            <p className="text-[9px] font-black text-[#F0F4F2]/20 uppercase tracking-[0.3em]">
              Return to send // Shift + Return for new line
            </p>
          </div>
        </div>
      </main>

      {/* MEMBERS SIDEBAR */}
      <AnimatePresence>
        {showMembers && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-[var(--theme-card-alt)] border-l border-white/5 overflow-hidden"
          >
            <div className="p-10 border-b border-white/5">
              <h3 className="text-xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
                Team Members
              </h3>
              <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-[0.3em] mt-2 opacity-60">
                {members.length} Active
              </p>
            </div>
            <div
              className="p-6 space-y-3 overflow-y-auto no-scrollbar"
              style={{ maxHeight: "calc(100vh - 300px)" }}
            >
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="p-4 bg-[var(--theme-card)] rounded-2xl border border-white/5 hover:border-[var(--theme-accent)]/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-card-alt)] text-[var(--theme-accent)] flex items-center justify-center text-sm font-black uppercase border border-white/5">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-[#F0F4F2] uppercase truncate">
                          {member.name}
                        </p>
                        {member.isOwner && (
                          <span className="px-2 py-0.5 bg-[var(--theme-accent)] text-[var(--theme-background)] text-[7px] font-black rounded uppercase">
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-[var(--theme-accent)]/60 uppercase tracking-wider truncate">
                        {member.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
