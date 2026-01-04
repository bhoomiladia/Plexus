"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Send,
  Loader2,
  AlertCircle,
  Volume2,
  VolumeX,
  ArrowLeft,
  User,
  Clock,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Interview {
  _id: string;
  projectId: string;
  applicationId: string;
  roleId: string;
  roleName: string;
  candidateName: string;
  projectTitle: string;
  projectDescription: string;
  status: string;
  messages: Message[];
}

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const interviewId = params.id as string;

  // Interview state
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Interview session state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // Media state
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [mediaError, setMediaError] = useState("");

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMicOnRef = useRef(false);

  // Fetch interview details
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await fetch(`/api/interview/${interviewId}`);
        if (res.ok) {
          const data = await res.json();
          setInterview(data.interview);
          if (data.interview.messages?.length > 0) {
            setMessages(data.interview.messages);
          }
          if (data.interview.status === "IN_PROGRESS") {
            setInterviewStarted(true);
          }
          if (data.interview.status === "COMPLETED") {
            setInterviewEnded(true);
            setInterviewStarted(true);
          }
        } else {
          setError("Interview not found");
        }
      } catch (err) {
        setError("Failed to load interview");
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchInterview();
    }
  }, [interviewId]);

  // Keep ref in sync with state
  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && interviewStarted && !interviewEnded) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          fetch(`/api/interview/${interviewId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tabSwitches: newCount }),
          });
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [interviewStarted, interviewEnded, interviewId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      stopCamera();
      stopMicrophone();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Camera functions
  const startCamera = async () => {
    try {
      setMediaError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsCameraOn(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      setMediaError("Camera access denied. Please allow camera permissions.");
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  // Refs for restart management
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRestartingRef = useRef(false);

  // Safe restart function with debouncing
  const safeRestartRecognition = useCallback((delay: number = 300) => {
    // Clear any pending restart
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    // Don't restart if already restarting or mic is off
    if (isRestartingRef.current || !isMicOnRef.current) {
      return;
    }

    isRestartingRef.current = true;

    restartTimeoutRef.current = setTimeout(() => {
      isRestartingRef.current = false;
      
      if (isMicOnRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e: any) {
          // If already started or invalid state, ignore
          if (e.name !== "InvalidStateError") {
            console.error("Failed to restart recognition:", e);
          }
        }
      }
    }, delay);
  }, []);

  // Microphone / Speech Recognition functions
  const startMicrophone = () => {
    try {
      setMediaError("");
      
      const SpeechRecognitionAPI = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognitionAPI) {
        setMediaError("Speech recognition not supported. Please use Chrome or Edge.");
        return;
      }

      // First request microphone permission
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          // Stop the stream immediately, we just needed permission
          stream.getTracks().forEach(track => track.stop());
          
          const recognition = new SpeechRecognitionAPI();
          recognition.continuous = true; // Keep listening continuously
          recognition.interimResults = true;
          recognition.lang = "en-US";
          recognition.maxAlternatives = 1;

          recognition.onstart = () => {
            setIsListening(true);
            setMediaError("");
            isRestartingRef.current = false;
          };

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimText = "";
            let finalText = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i];
              const text = result[0].transcript;
              
              if (result.isFinal) {
                finalText += text + " ";
              } else {
                interimText += text;
              }
            }

            if (finalText) {
              setInput((prev) => (prev + " " + finalText).trim());
              setTranscript("");
            } else {
              setTranscript(interimText);
            }
          };

          recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error:", event.error);
            
            switch (event.error) {
              case "not-allowed":
                setMediaError("Microphone access denied. Please allow microphone permissions.");
                setIsMicOn(false);
                setIsListening(false);
                break;
              case "no-speech":
                // No speech detected - this is normal, just continue listening
                // Don't restart here, let onend handle it
                break;
              case "network":
                // Network error - restart with longer delay
                setIsListening(false);
                console.log("Network error, will restart speech recognition...");
                safeRestartRecognition(1000);
                break;
              case "aborted":
                // Aborted - only restart if mic should still be on
                setIsListening(false);
                if (isMicOnRef.current) {
                  safeRestartRecognition(500);
                }
                break;
              case "audio-capture":
                setMediaError("No microphone detected. Please check your audio input.");
                setIsMicOn(false);
                setIsListening(false);
                break;
              default:
                // For other errors, show message but try to recover
                setMediaError(`Speech error: ${event.error}. Retrying...`);
                setIsListening(false);
                safeRestartRecognition(1000);
            }
          };

          recognition.onend = () => {
            setIsListening(false);
            // Only restart if mic should still be on and not already restarting
            if (isMicOnRef.current && !isRestartingRef.current) {
              safeRestartRecognition(300);
            }
          };

          recognitionRef.current = recognition;
          recognition.start();
          setIsMicOn(true);
        })
        .catch((err) => {
          console.error("Microphone permission error:", err);
          setMediaError("Microphone access denied. Please allow microphone permissions.");
          setIsMicOn(false);
        });
    } catch (err: any) {
      console.error("Microphone error:", err);
      setMediaError("Failed to start microphone. Please check permissions.");
      setIsMicOn(false);
    }
  };

  const stopMicrophone = () => {
    // Clear any pending restart timeout
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    isRestartingRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }
    setIsMicOn(false);
    setIsListening(false);
    setTranscript("");
  };

  const toggleMic = () => {
    if (isMicOn) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  };

  // Text-to-speech
  const speakText = useCallback((text: string) => {
    if (!isAudioOn || typeof window === "undefined") return;

    const synth = window.speechSynthesis;
    synth.cancel(); // Cancel any ongoing speech

    // Clean the text
    const cleanText = text
      .replace("[END_INTERVIEW]", "")
      .replace(/\[.*?\]/g, "")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Get voices and select a good one
    const voices = synth.getVoices();
    const englishVoice = voices.find(
      (v) => 
        v.lang.startsWith("en") && 
        (v.name.includes("Google") || v.name.includes("Microsoft") || v.name.includes("Samantha"))
    ) || voices.find((v) => v.lang.startsWith("en"));
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
  }, [isAudioOn]);

  // Load voices when available
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Start interview
  const startInterview = async () => {
    setInterviewStarted(true);
    setIsLoading(true);

    try {
      // Update interview status
      await fetch(`/api/interview/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      // Get first AI message
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          projectTitle: interview?.projectTitle,
          projectDesc: interview?.projectDescription,
          role: interview?.roleName,
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

        setMessages([{ role: "assistant", content: assistantMessage, timestamp: new Date() }]);
      }

      // Speak the AI response
      const cleanMessage = assistantMessage.replace("[END_INTERVIEW]", "");
      speakText(cleanMessage);

      if (assistantMessage.includes("[END_INTERVIEW]")) {
        await completeInterview(assistantMessage);
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      setMessages([{
        role: "assistant",
        content: "I apologize, but there was an error starting the interview. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading || interviewEnded) return;

    const userMessage = input.trim();
    const messageWithContext = tabSwitchCount > 0
      ? `[TAB_SWITCH_DETECTED] ${userMessage}`
      : userMessage;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage, timestamp: new Date() },
    ];

    setMessages(newMessages);
    setInput("");
    setTranscript("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.role === "user" && m.content === userMessage ? messageWithContext : m.content,
          })),
          projectTitle: interview?.projectTitle,
          projectDesc: interview?.projectDescription,
          role: interview?.roleName,
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
          { role: "assistant", content: assistantMessage, timestamp: new Date() },
        ]);
      }

      // Save messages to backend
      await fetch(`/api/interview/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...newMessages,
            { role: "assistant", content: assistantMessage, timestamp: new Date() },
          ],
        }),
      });

      // Speak the AI response
      const cleanMessage = assistantMessage.replace("[END_INTERVIEW]", "");
      speakText(cleanMessage);

      if (tabSwitchCount > 0) {
        setTabSwitchCount(0);
      }

      if (assistantMessage.includes("[END_INTERVIEW]")) {
        await completeInterview(assistantMessage);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "I apologize, there was an error. Could you repeat that?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Complete interview
  const completeInterview = async (aiVerdict: string) => {
    setInterviewEnded(true);

    // Stop media
    stopCamera();
    stopMicrophone();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Update backend
    await fetch(`/api/interview/${interviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "complete",
        aiVerdict,
      }),
    });
  };

  if (loading) {
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex items-center justify-center border border-white/5">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--theme-accent)]" />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex flex-col items-center justify-center border border-white/5">
        <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-black text-[#F0F4F2] uppercase tracking-widest mb-4">
          {error || "Interview Not Found"}
        </h2>
        <Link
          href="/dashboard/notifications"
          className="px-6 py-3 bg-[var(--theme-accent)] text-[var(--theme-card)] rounded-2xl font-black uppercase text-sm"
        >
          Back to Notifications
        </Link>
      </div>
    );
  }

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3.5rem] flex flex-col overflow-hidden border border-white/5">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[var(--theme-card-alt)]">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/notifications"
            className="p-3 bg-[var(--theme-card)] hover:bg-[var(--theme-muted)] rounded-xl text-[var(--theme-accent)] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase text-[#F0F4F2] tracking-tighter">
              AI Interview
            </h1>
            <p className="text-[var(--theme-accent)] text-xs font-bold">
              {interview.roleName} • {interview.projectTitle}
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
          {interviewStarted && !interviewEnded && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-xs font-bold animate-pulse">
              <Clock size={14} />
              In Progress
            </div>
          )}
          {interviewEnded && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] rounded-xl text-xs font-bold">
              <CheckCircle size={14} />
              Completed
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Panel */}
        <div className="w-80 bg-[var(--theme-card-alt)] border-r border-white/5 flex flex-col">
          {/* Camera View */}
          <div className="relative aspect-video bg-[var(--theme-card)] m-4 rounded-2xl overflow-hidden border border-white/5">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${isCameraOn ? "block" : "hidden"}`}
            />
            {!isCameraOn && (
              <div className="w-full h-full flex items-center justify-center">
                <User size={48} className="text-[var(--theme-accent)]/30" />
              </div>
            )}
            {isSpeaking && (
              <div className="absolute bottom-2 left-2 px-3 py-1 bg-[var(--theme-accent)] text-[var(--theme-card)] rounded-full text-[10px] font-bold animate-pulse">
                AI Speaking...
              </div>
            )}
            {isListening && (
              <div className="absolute bottom-2 right-2 px-3 py-1 bg-red-500 text-white rounded-full text-[10px] font-bold animate-pulse flex items-center gap-1">
                <Mic size={10} /> Listening
              </div>
            )}
          </div>

          {/* Media Error */}
          {mediaError && (
            <div className="mx-4 mb-2 p-3 bg-red-500/20 text-red-400 rounded-xl text-xs">
              {mediaError}
            </div>
          )}

          {/* Media Controls */}
          <div className="p-4 flex justify-center gap-3">
            <button
              onClick={toggleCamera}
              title={isCameraOn ? "Turn off camera" : "Turn on camera"}
              className={`p-4 rounded-2xl transition-all ${
                isCameraOn
                  ? "bg-[var(--theme-accent)] text-[var(--theme-card)]"
                  : "bg-[var(--theme-card)] text-[var(--theme-accent)] border border-white/5 hover:bg-[var(--theme-muted)]"
              }`}
            >
              {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button
              onClick={toggleMic}
              title={isMicOn ? "Turn off microphone" : "Turn on microphone"}
              className={`p-4 rounded-2xl transition-all ${
                isMicOn
                  ? "bg-[var(--theme-accent)] text-[var(--theme-card)]"
                  : "bg-[var(--theme-card)] text-[var(--theme-accent)] border border-white/5 hover:bg-[var(--theme-muted)]"
              }`}
            >
              {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              onClick={() => {
                setIsAudioOn(!isAudioOn);
                if (typeof window !== "undefined" && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
              }}
              title={isAudioOn ? "Mute AI voice" : "Unmute AI voice"}
              className={`p-4 rounded-2xl transition-all ${
                isAudioOn
                  ? "bg-[var(--theme-accent)] text-[var(--theme-card)]"
                  : "bg-[var(--theme-card)] text-[var(--theme-accent)] border border-white/5"
              }`}
            >
              {isAudioOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>

          {/* Listening indicator */}
          {isListening && (
            <div className="px-4 pb-4">
              <div className="p-3 bg-[var(--theme-card)] rounded-xl border border-[var(--theme-accent)]/30">
                <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-widest mb-2">
                  Listening...
                </p>
                <p className="text-[#F0F4F2]/60 text-xs">
                  {transcript || "Speak now..."}
                </p>
              </div>
            </div>
          )}

          {/* Interview Info */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="bg-[var(--theme-card)] p-4 rounded-2xl border border-white/5">
              <h3 className="text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-3 opacity-60">
                Interview Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] text-[var(--theme-accent)]/50 uppercase">Position</p>
                  <p className="text-sm font-bold text-[#F0F4F2]">{interview.roleName}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[var(--theme-accent)]/50 uppercase">Project</p>
                  <p className="text-sm font-bold text-[#F0F4F2]">{interview.projectTitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col">
          {!interviewStarted ? (
            /* Pre-interview Screen */
            <div className="flex-1 flex flex-col items-center justify-center p-10">
              <div className="w-32 h-32 rounded-full bg-[var(--theme-card-alt)] border border-white/10 flex items-center justify-center mb-8">
                <Video size={64} className="text-[var(--theme-accent)]" />
              </div>
              <h2 className="text-3xl font-black uppercase text-[#F0F4F2] tracking-tighter mb-4 text-center">
                Ready for Your Interview?
              </h2>
              <p className="text-[var(--theme-accent)]/60 text-sm text-center max-w-md mb-8">
                You'll be interviewed by an AI for the <span className="text-[var(--theme-accent)]">{interview.roleName}</span> position.
                Make sure your camera and microphone are working.
              </p>

              <div className="bg-[var(--theme-card-alt)] p-6 rounded-2xl border border-white/5 mb-8 max-w-lg">
                <h4 className="text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest mb-3 opacity-60">
                  Tips for Success
                </h4>
                <ul className="space-y-2 text-sm text-[#F0F4F2]/60">
                  <li>• Find a quiet place with good lighting</li>
                  <li>• Enable camera and microphone for best experience</li>
                  <li>• Stay on this tab during the interview</li>
                  <li>• Answer questions clearly and concisely</li>
                </ul>
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

              {/* Interview Completed */}
              {interviewEnded && (
                <div className="p-6 border-t border-white/5 bg-[var(--theme-card-alt)]">
                  <div className="text-center">
                    <CheckCircle className="mx-auto mb-4 text-[var(--theme-accent)]" size={48} />
                    <h3 className="text-xl font-black uppercase text-[#F0F4F2] tracking-tighter mb-2">
                      Interview Complete!
                    </h3>
                    <p className="text-[var(--theme-accent)]/60 text-sm mb-4">
                      Thank you for completing the interview. The project owner will review your responses.
                    </p>
                    <Link
                      href="/dashboard/notifications"
                      className="inline-block px-8 py-4 bg-[var(--theme-accent)] text-[var(--theme-card)] rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all"
                    >
                      Back to Dashboard
                    </Link>
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
                      placeholder="Type or speak your response..."
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
                    {isMicOn ? "Voice input active • " : ""}Press Enter to send
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
