"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Mic,
  MicOff,
  Send,
  Loader2,
  Video,
  Phone,
  PhoneOff,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    userId: string;
    userName: string;
    userEmail: string;
  };
  project: {
    _id: string;
    title: string;
    description: string;
  };
  role: {
    _id: string;
    roleName: string;
    mandatorySkills: string[];
  };
  onInterviewComplete: (result: "pass" | "fail") => void;
}

export default function InterviewModal({
  isOpen,
  onClose,
  candidate,
  project,
  role,
  onInterviewComplete,
}: InterviewModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && interviewStarted && !interviewEnded) {
        setTabSwitchCount((prev) => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [interviewStarted, interviewEnded]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && interviewStarted) {
      inputRef.current?.focus();
    }
  }, [isOpen, interviewStarted]);

  const startInterview = async () => {
    setInterviewStarted(true);
    setIsLoading(true);

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          projectTitle: project.title,
          projectDesc: project.description,
          role: role.roleName,
        }),
      });

      if (!response.ok) throw new Error("Failed to start interview");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        assistantMessage += chunk;
        
        setMessages([{ role: "assistant", content: assistantMessage }]);
      }

      if (assistantMessage.includes("[END_INTERVIEW]")) {
        setInterviewEnded(true);
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      setMessages([{
        role: "assistant",
        content: "I apologize, but there was an error starting the interview. Please try again.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || interviewEnded) return;

    const userMessage = input.trim();
    
    // Add tab switch indicator if detected
    const messageWithContext = tabSwitchCount > 0 
      ? `[TAB_SWITCH_DETECTED] ${userMessage}`
      : userMessage;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.role === "user" && tabSwitchCount > 0 && m.content === userMessage
              ? messageWithContext
              : m.content,
          })),
          projectTitle: project.title,
          projectDesc: project.description,
          role: role.roleName,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        assistantMessage += chunk;
        
        setMessages([
          ...newMessages,
          { role: "assistant", content: assistantMessage },
        ]);
      }

      // Reset tab switch count after message is sent
      if (tabSwitchCount > 0) {
        setTabSwitchCount(0);
      }

      if (assistantMessage.includes("[END_INTERVIEW]")) {
        setInterviewEnded(true);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "I apologize, there was an error. Could you repeat that?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMessages([]);
    setInput("");
    setInterviewStarted(false);
    setInterviewEnded(false);
    setTabSwitchCount(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[var(--theme-card)] rounded-[3rem] border border-white/10 w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[var(--theme-card-alt)]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--theme-muted)] flex items-center justify-center">
                <Video size={24} className="text-[var(--theme-accent)]" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase text-[#F0F4F2] tracking-tighter">
                  AI Interview
                </h2>
                <p className="text-[var(--theme-accent)] text-xs font-bold">
                  {candidate.userName} • {role.roleName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {tabSwitchCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl text-xs font-bold">
                  <AlertCircle size={14} />
                  Tab switches: {tabSwitchCount}
                </div>
              )}
              <button
                onClick={handleClose}
                className="p-3 bg-[var(--theme-card)] hover:bg-red-500/20 rounded-xl text-[var(--theme-accent)] hover:text-red-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Interview Content */}
          {!interviewStarted ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10">
              <div className="w-32 h-32 rounded-full bg-[var(--theme-card-alt)] border border-white/10 flex items-center justify-center mb-8">
                <User size={64} className="text-[var(--theme-accent)]" />
              </div>
              <h3 className="text-3xl font-black uppercase text-[#F0F4F2] tracking-tighter mb-4 text-center">
                Interview: {candidate.userName}
              </h3>
              <p className="text-[var(--theme-accent)]/60 text-sm text-center max-w-md mb-4">
                Position: <span className="text-[var(--theme-accent)]">{role.roleName}</span>
              </p>
              <p className="text-[var(--theme-accent)]/60 text-sm text-center max-w-md mb-8">
                Project: <span className="text-[var(--theme-accent)]">{project.title}</span>
              </p>
              
              <div className="bg-[var(--theme-card-alt)] p-6 rounded-2xl border border-white/5 mb-8 max-w-lg">
                <h4 className="text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-3 opacity-60">
                  Required Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {role.mandatorySkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[var(--theme-card)] text-[var(--theme-accent)] text-xs font-bold rounded-lg border border-white/5"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={startInterview}
                className="px-10 py-5 bg-[var(--theme-accent)] text-[var(--theme-card)] rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3"
              >
                <Phone size={20} />
                Start Interview
              </button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-5 rounded-2xl ${
                        message.role === "user"
                          ? "bg-[var(--theme-accent)] text-[var(--theme-card)] rounded-tr-none"
                          : "bg-[var(--theme-card-alt)] text-[#F0F4F2] rounded-tl-none border border-white/5"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-widest mb-2 opacity-60">
                          AI Interviewer
                        </p>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content.replace("[END_INTERVIEW]", "")}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--theme-card-alt)] p-5 rounded-2xl rounded-tl-none border border-white/5">
                      <Loader2 className="animate-spin text-[var(--theme-accent)]" size={20} />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Interview Ended */}
              {interviewEnded && (
                <div className="p-6 border-t border-white/5 bg-[var(--theme-card-alt)]">
                  <div className="text-center mb-4">
                    <p className="text-[var(--theme-accent)] font-bold text-sm mb-4">
                      Interview Complete - Make your decision
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => {
                          onInterviewComplete("pass");
                          handleClose();
                        }}
                        className="flex items-center gap-2 px-8 py-4 bg-green-500/20 text-green-400 rounded-2xl font-black uppercase tracking-widest hover:bg-green-500/30 transition-all"
                      >
                        <CheckCircle size={20} />
                        Pass - Accept
                      </button>
                      <button
                        onClick={() => {
                          onInterviewComplete("fail");
                          handleClose();
                        }}
                        className="flex items-center gap-2 px-8 py-4 bg-red-500/20 text-red-400 rounded-2xl font-black uppercase tracking-widest hover:bg-red-500/30 transition-all"
                      >
                        <XCircle size={20} />
                        Fail - Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Input */}
              {!interviewEnded && (
                <div className="p-6 border-t border-white/5 bg-[var(--theme-card-alt)]/50">
                  <div className="flex items-center gap-4">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type your response..."
                      disabled={isLoading}
                      className="flex-1 bg-[var(--theme-card)] border border-white/5 rounded-2xl px-6 py-4 text-[#F0F4F2] outline-none focus:border-[var(--theme-accent)]/50 transition-colors disabled:opacity-50"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      className="p-4 bg-[var(--theme-accent)] text-[var(--theme-card)] rounded-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin" size={24} />
                      ) : (
                        <Send size={24} />
                      )}
                    </button>
                  </div>
                  <p className="text-[9px] font-black text-[var(--theme-accent)]/40 uppercase tracking-widest mt-3 text-center">
                    Press Enter to send • Stay focused on this tab
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
