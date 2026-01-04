"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, ShieldAlert, ArrowLeft, Loader2, Waves, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VoiceInterviewPage() {
  const router = useRouter();
  const [project] = useState({ title: "E-Commerce Engine", role: "Full Stack Dev", desc: "Microservices architecture." });

  // States
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [currentCaption, setCurrentCaption] = useState("");
  const [cheatLogs, setCheatLogs] = useState(0);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");

  // Initialize Speech
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      recognitionRef.current = new SpeechRec();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (e: any) => {
        transcriptRef.current = e.results[e.results.length - 1][0].transcript;
      };
    }

    const handleVisibility = () => {
      if (document.hidden && !isEnded) {
        setCheatLogs(p => p + 1);
        setHistory(prev => [...prev, { role: "system", content: "[TAB_SWITCH_DETECTED]" }]);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isEnded]);

  const handleDone = async () => {
    if (isProcessing || !transcriptRef.current) return;
    
    // UI Setup
    window.speechSynthesis.cancel();
    setIsProcessing(true);
    setIsListening(false);
    recognitionRef.current?.stop();

    const newHistory = [...history, { role: "user", content: transcriptRef.current }];
    setHistory(newHistory);
    transcriptRef.current = "";

    const res = await fetch("/api/interview", {
      method: "POST",
      body: JSON.stringify({ messages: newHistory, ...project }),
    });

    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let aiFullText = "";
    let sentenceBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      aiFullText += chunk;
      sentenceBuffer += chunk;
      
      // Update Captions character by character
      setCurrentCaption(aiFullText);

      if (/[.!?]/.test(chunk)) {
        const textToSpeak = sentenceBuffer.replace("[END_INTERVIEW]", "");
        await speak(textToSpeak);
        if (sentenceBuffer.includes("[END_INTERVIEW]")) setIsEnded(true);
        sentenceBuffer = "";
      }
    }
    setHistory(prev => [...prev, { role: "assistant", content: aiFullText.replace("[END_INTERVIEW]", "") }]);
    setIsProcessing(false);
    setTimeout(() => setCurrentCaption(""), 2000); // Clear captions
  };

  const speak = (text: string) => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // Slightly faster for realism
      setIsAISpeaking(true);
      utterance.onend = () => { setIsAISpeaking(false); resolve(true); };
      window.speechSynthesis.speak(utterance);
    });
  };

  return (
    <div className="ml-80 mr-8 mt-2 mb-8 min-h-[calc(100vh-120px)] bg-[var(--theme-card)] rounded-[3rem] p-10 flex flex-col items-center justify-between relative overflow-hidden transition-all duration-300">
      
      {/* Top Bar */}
      <div className="w-full flex justify-between items-start z-10">
        <div className="bg-[var(--theme-muted)] rounded-[2.5rem] px-8 py-6 text-[#F0F4F2] border border-white/5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-accent)]">Secure Connection</span>
          <h1 className="text-3xl font-black uppercase mt-1 tracking-tighter">{project.role}</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCaptions(!showCaptions)} className="p-4 bg-[var(--theme-card-alt)] rounded-2xl text-[var(--theme-accent)] border border-white/5">
            {showCaptions ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          <button onClick={() => router.back()} className="p-4 bg-[var(--theme-card-alt)] rounded-2xl text-[var(--theme-accent)] border border-white/5">
            <ArrowLeft size={20} />
          </button>
        </div>
      </div>

      {/* Voice Orb Area */}
      <div className="relative flex flex-col items-center justify-center">
        <motion.div 
          animate={{ 
            scale: isAISpeaking || isListening ? [1, 1.1, 1] : 1,
            boxShadow: isListening ? "0 0 80px rgba(136, 171, 142, 0.3)" : isAISpeaking ? "0 0 80px rgba(62, 92, 88, 0.4)" : "none"
          }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-700 ${
            isListening ? "bg-[var(--theme-accent)]" : isAISpeaking ? "bg-[var(--theme-muted)]" : "bg-[var(--theme-card-alt)]"
          }`}
        >
          {isProcessing ? <Loader2 className="w-12 h-12 text-[var(--theme-accent)] animate-spin" /> : <Waves className="w-16 h-16 text-white/20" />}
        </motion.div>

        {/* Floating Captions */}
        <AnimatePresence>
          {showCaptions && currentCaption && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-72 w-[600px] text-center">
              <p className="text-lg font-bold text-[#F0F4F2] bg-[var(--theme-card)]/90 backdrop-blur px-6 py-4 rounded-[2rem] border border-white/5">
                {currentCaption}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div className="w-full max-w-lg space-y-4 z-10">
        {!isEnded ? (
          <button
            onClick={() => isListening ? handleDone() : (recognitionRef.current.start(), setIsListening(true))}
            disabled={isProcessing || isAISpeaking}
            className={`w-full py-8 rounded-[2.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 border-2 transition-all ${
              isListening ? "bg-red-500/10 border-red-500 text-red-500" : "bg-[var(--theme-accent)] border-transparent text-[var(--theme-card)]"
            } disabled:opacity-20`}
          >
            {isListening ? <><Square fill="currentColor" size={16}/> Submit Answer</> : <><Mic size={18}/> Push to Speak</>}
          </button>
        ) : (
          <button onClick={() => router.push('/dashboard')} className="w-full py-8 bg-[var(--theme-muted)] text-white rounded-[2.5rem] font-black uppercase text-xs">
            Interview Ended • View Dashboard
          </button>
        )}
        
        {cheatLogs > 0 && (
          <div className="flex justify-center gap-2 items-center text-red-500 text-[10px] font-black uppercase">
            <ShieldAlert size={14} /> Security Alert: {cheatLogs} window switches logged
          </div>
        )}
      </div>
    </div>
  );
}