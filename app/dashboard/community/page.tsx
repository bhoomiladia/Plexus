"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Sparkles,
  Search,
  Heart,
  Trash2,
  CheckCircle,
  Send,
  User,
  PlusCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

// --- TYPES ---
interface Response {
  id: string;
  userId: string;
  author: string;
  text: string;
  isAI: boolean;
  createdAt: string;
}

interface Issue {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  content: string;
  tags: string[];
  responses: Response[];
  likes: number;
  likedBy: string[];
  status: "open" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
}
// --- MAIN COMPONENT ---
export default function CommunityPage() {
  const { data: session } = useSession();

  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "open" | "resolved" | "my" | "post"
  >("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [newIssue, setNewIssue] = useState({
    title: "",
    content: "",
    tags: "",
  });
  const [responseText, setResponseText] = useState<{ [key: string]: string }>(
    {}
  );
  const [aiLoading, setAiLoading] = useState<{ [key: string]: boolean }>({});

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/community/issues?search=${searchQuery}`
      );
      if (response.ok) {
        const data = await response.json();
        setIssues(data.issues || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [searchQuery]);

  const handlePostIssue = async () => {
    if (!newIssue.title.trim() || !newIssue.content.trim()) return;
    try {
      const response = await fetch("/api/community/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newIssue.title,
          content: newIssue.content,
          tags: newIssue.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      if (response.ok) {
        setNewIssue({ title: "", content: "", tags: "" });
        setActiveTab("my");
        fetchIssues();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredIssues = useMemo(() => {
    const userId = session?.user?.id;
    if (activeTab === "my") return issues.filter((i) => i.userId === userId);
    const browsePool = issues.filter((i) => i.userId !== userId);
    if (activeTab === "open")
      return browsePool.filter((i) => i.status === "open");
    if (activeTab === "resolved")
      return browsePool.filter((i) => i.status === "resolved");
    return browsePool;
  }, [issues, activeTab, session]);

  if (loading && issues.length === 0)
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--theme-accent)]" />
      </div>
    );

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] p-10 overflow-y-auto no-scrollbar border border-white/5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-10"
      >
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-5xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
              Community Forum
            </h1>
            <p className="text-[var(--theme-accent)] font-bold tracking-[0.2em] text-[10px] uppercase opacity-60 mt-2">
              Collective Intelligence Hub
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-[var(--theme-card-alt)] px-8 py-4 rounded-[2rem] border border-white/5 text-center min-w-[140px]">
              <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-widest opacity-50">
                Open
              </p>
              <p className="text-2xl font-black text-[#F0F4F2]">
                {issues.filter((i) => i.status === "open").length}
              </p>
            </div>
            <div className="bg-[var(--theme-muted)] px-8 py-4 rounded-[2rem] text-center min-w-[140px]">
              <p className="text-[9px] font-black text-[#F0F4F2] uppercase tracking-widest opacity-60">
                Solved
              </p>
              <p className="text-2xl font-black text-[var(--theme-accent)]">
                {issues.filter((i) => i.status === "resolved").length}
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION & SEARCH */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/5 pb-2">
          <div className="flex gap-8 overflow-x-auto w-full no-scrollbar">
            {[
              { id: "open", label: "Open Issues", icon: MessageSquare },
              { id: "resolved", label: "Resolved", icon: CheckCircle },
              { id: "my", label: "My Posts", icon: User },
              { id: "post", label: "Start Thread", icon: PlusCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                  activeTab === tab.id
                    ? "text-[var(--theme-accent)]"
                    : "text-[#F0F4F2]/30 hover:text-[#F0F4F2]"
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--theme-accent)] rounded-t-full"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-accent)]/40"
              size={14}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-[var(--theme-card-alt)] border border-white/5 rounded-2xl text-[10px] font-bold text-[#F0F4F2] outline-none focus:ring-2 focus:ring-[var(--theme-accent)] transition-all placeholder:text-white/10 uppercase tracking-widest"
              placeholder="Search Protocol..."
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* MAIN FEED */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <AnimatePresence mode="wait">
              {activeTab === "post" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[var(--theme-card-alt)] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-8"
                >
                  <h2 className="text-3xl font-black   uppercase text-[#F0F4F2] tracking-tighter">
                    New Transmission
                  </h2>
                  <div className="space-y-6">
                    <input
                      value={newIssue.title}
                      onChange={(e) =>
                        setNewIssue({ ...newIssue, title: e.target.value })
                      }
                      className="w-full bg-[var(--theme-card)] border border-white/5 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-[var(--theme-accent)] text-[#F0F4F2] font-bold"
                      placeholder="Title of Blocker"
                    />
                    <textarea
                      value={newIssue.content}
                      onChange={(e) =>
                        setNewIssue({ ...newIssue, content: e.target.value })
                      }
                      className="w-full bg-[var(--theme-card)] border border-white/5 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-[var(--theme-accent)] text-[#F0F4F2] min-h-[250px]"
                      placeholder="Describe the operational failure..."
                    />
                    <button
                      onClick={handlePostIssue}
                      className="w-full bg-[var(--theme-accent)] text-[var(--theme-background)] py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] hover:scale-[1.02] transition-all"
                    >
                      Publish Transmission
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {filteredIssues.length === 0 ? (
                    <div className="text-center py-24 bg-[var(--theme-card-alt)]/30 rounded-[3.5rem] border border-dashed border-white/10">
                      <AlertCircle
                        className="mx-auto mb-4 text-[#F0F4F2]/20"
                        size={48}
                      />
                      <p className="text-[#F0F4F2]/30 font-bold uppercase tracking-widest text-xs">
                        No issues found
                      </p>
                    </div>
                  ) : (
                    filteredIssues.map((issue) => (
                      <IssueCard
                        key={issue._id}
                        issue={issue}
                        session={session}
                        onRefresh={fetchIssues}
                      />
                    ))
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* SIDEBAR */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-[var(--theme-muted)] p-10 rounded-[3.5rem] text-[#F0F4F2] relative overflow-hidden">
              <TrendingUp className="mb-6 text-[var(--theme-accent)]" size={32} />
              <h3 className="text-2xl font-black   uppercase tracking-tighter mb-4">
                AI Debugging
              </h3>
              <p className="text-xs font-medium opacity-80 leading-relaxed mb-6">
                Gemini 3 Flash is integrated to analyze code blocks and provide
                instant solutions for complex logic errors.
              </p>
              <div className="h-1 w-20 bg-[var(--theme-accent)]" />
            </div>

            <div className="bg-[var(--theme-card-alt)] p-10 rounded-[3.5rem] border border-white/5">
              <h4 className="text-[10px] font-black text-[var(--theme-accent)] uppercase tracking-[0.2em] mb-6 opacity-50">
                Protocol Rules
              </h4>
              <ul className="space-y-4">
                {[
                  "Be specific with logs",
                  "Mark solved when fixed",
                  "Respect peers",
                ].map((rule, idx) => (
                  <li
                    key={idx}
                    className="flex gap-4 items-center text-[11px] font-bold text-[#F0F4F2]/60 uppercase tracking-wider"
                  >
                    <div className="w-1.5 h-1.5 bg-[var(--theme-accent)] rounded-full" />{" "}
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- REFINED ISSUE CARD ---
function IssueCard({ issue, session, onRefresh }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isOwner = session?.user?.id === issue.userId;

  const handleAddResponse = async () => {
    if (!responseText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/issues/${issue._id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: responseText }),
      });
      if (res.ok) {
        setResponseText("");
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to add response:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIAudit = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(
        `/api/community/issues/${issue._id}/ai-response`,
        {
          method: "POST",
        }
      );
      const data = await res.json();
      if (res.ok) {
        onRefresh();
      } else {
        alert(data.message || "AI audit failed");
      }
    } catch (error) {
      console.error("AI audit error:", error);
      alert("Failed to generate AI response");
    } finally {
      setAiLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await fetch(`/api/community/issues/${issue._id}/like`, {
        method: "POST",
      });
      onRefresh();
    } catch (error) {
      console.error("Failed to like:", error);
    }
  };

  const handleResolve = async () => {
    try {
      await fetch(`/api/community/issues/${issue._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      onRefresh();
    } catch (error) {
      console.error("Failed to resolve:", error);
    }
  };

  const hasAIResponse = issue.responses?.some((r: any) => r.isAI);
  const userLiked = issue.likedBy?.includes(session?.user?.id);

  return (
    <div
      className={`bg-[var(--theme-card-alt)] rounded-[2.5rem] border border-white/5 overflow-hidden transition-all duration-300 ${isOpen ? "ring-2 ring-[var(--theme-accent)]/20" : ""}`}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-8 flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-6 flex-1">
          <div className="w-14 h-14 rounded-[1.2rem] bg-[var(--theme-card)] text-[var(--theme-accent)] flex items-center justify-center font-black text-xl border border-white/5 uppercase">
            {issue.userName?.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black   text-[#F0F4F2] uppercase tracking-tighter group-hover:text-[var(--theme-accent)] transition-all">
                {issue.title}
              </h3>
              {issue.status === "resolved" && (
                <span className="px-3 py-1 bg-green-500/20 text-green-500 text-[8px] font-black rounded-full uppercase">
                  Solved
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-[0.2em] opacity-60">
                {issue.userName} /{" "}
                {new Date(issue.createdAt).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                {issue.tags?.slice(0, 2).map((t: string) => (
                  <span
                    key={t}
                    className="text-[8px] bg-[var(--theme-card)] px-2 py-1 rounded-md text-[#F0F4F2]/40 font-black uppercase tracking-widest"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[var(--theme-accent)]/60">
            <MessageSquare size={16} />
            <span className="text-xs font-black">
              {issue.responses?.length || 0}
            </span>
          </div>
          <div className="text-[var(--theme-accent)]/40 group-hover:text-[var(--theme-accent)]">
            {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="border-t border-white/5"
          >
            <div className="p-10 bg-[var(--theme-card)]/50 space-y-8">
              {/* Issue Content */}
              <div className="bg-[var(--theme-card)] p-8 rounded-[2rem] border border-white/5">
                <p className="text-[#F0F4F2]/80 text-sm leading-relaxed whitespace-pre-wrap">
                  {issue.content}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike();
                  }}
                  className={`px-6 py-3 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all ${
                    userLiked
                      ? "bg-red-500/20 text-red-500"
                      : "bg-white/5 text-[var(--theme-accent)] hover:bg-[var(--theme-accent)] hover:text-[var(--theme-background)]"
                  }`}
                >
                  <Heart size={14} fill={userLiked ? "currentColor" : "none"} />
                  {issue.likes || 0}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAIAudit();
                  }}
                  disabled={aiLoading || hasAIResponse}
                  className="px-8 py-3 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : hasAIResponse ? (
                    <>
                      <CheckCircle size={14} />
                      AI Responded
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      AI Audit
                    </>
                  )}
                </button>

                {isOwner && issue.status !== "resolved" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResolve();
                    }}
                    className="px-8 py-3 bg-green-500/20 text-green-500 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-green-500 hover:text-white transition-all"
                  >
                    <CheckCircle size={14} />
                    Mark Resolved
                  </button>
                )}
              </div>

              {/* Responses Section */}
              {issue.responses && issue.responses.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-[var(--theme-accent)] uppercase tracking-[0.2em]">
                    Responses ({issue.responses.length})
                  </h4>
                  {issue.responses.map((response: any) => (
                    <div
                      key={response.id}
                      className={`p-6 rounded-2xl border ${
                        response.isAI
                          ? "bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/30"
                          : "bg-[var(--theme-card)] border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {response.isAI ? (
                          <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)] flex items-center justify-center">
                            <Sparkles size={16} className="text-[var(--theme-background)]" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[var(--theme-card-alt)] text-[var(--theme-accent)] flex items-center justify-center text-xs font-black uppercase">
                            {response.author?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-black text-[#F0F4F2] uppercase">
                            {response.author}
                          </p>
                          <p className="text-[9px] text-[var(--theme-accent)]/60 uppercase tracking-wider">
                            {new Date(response.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-[#F0F4F2]/80 leading-relaxed whitespace-pre-wrap">
                        {response.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Response */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-[var(--theme-accent)] uppercase tracking-[0.2em]">
                  Add Response
                </h4>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Share your solution or insights..."
                  className="w-full bg-[var(--theme-card)] border border-white/5 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-[var(--theme-accent)] text-[#F0F4F2] min-h-[120px] text-sm"
                />
                <button
                  onClick={handleAddResponse}
                  disabled={submitting || !responseText.trim()}
                  className="px-8 py-3 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Response
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
