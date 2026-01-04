"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Award,
  AlertTriangle,
  Clock,
} from "lucide-react";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

type QuizResult = {
  passed: boolean;
  score: number;
  total: number;
  results: {
    questionId: string;
    question: string;
    userAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }[];
};

type Props = {
  skill: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (skill: string) => void;
};

export default function SkillQuizModal({ skill, isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTimeUp = useCallback(() => {
    if (questions.length === 0 || evaluating || result) return;
    
    const currentQuestion = questions[currentIndex];
    const newAnswers = [...answers, { questionId: currentQuestion.id, selectedIndex: -1 }];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTimeLeft(15);
    } else {
      evaluateQuizWithAnswers(newAnswers);
    }
  }, [currentIndex, questions, answers, evaluating, result]);

  // Timer effect
  useEffect(() => {
    if (questions.length > 0 && !result && !evaluating && !loading) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [questions, result, evaluating, loading, currentIndex]);

  // Handle time up
  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0 && !evaluating && !result) {
      handleTimeUp();
    }
  }, [timeLeft, questions, evaluating, result, handleTimeUp]);

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(15);
  }, [currentIndex]);

  useEffect(() => {
    if (isOpen && skill) {
      generateQuiz();
    }
  }, [isOpen, skill]);

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setResult(null);

    try {
      const res = await fetch("/api/skill-quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to generate quiz");
      }

      setQuestions(data.questions);
    } catch (err) {
      setError("Failed to generate quiz. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (selectedIndex: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const currentQuestion = questions[currentIndex];
    const newAnswers = [...answers, { questionId: currentQuestion.id, selectedIndex }];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      evaluateQuizWithAnswers(newAnswers);
    }
  };

  const evaluateQuizWithAnswers = async (finalAnswers: { questionId: string; selectedIndex: number }[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setEvaluating(true);
    try {
      const res = await fetch("/api/skill-quiz/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, answers: finalAnswers }),
      });

      if (!res.ok) throw new Error("Failed to evaluate quiz");

      const data = await res.json();
      setResult(data);

      if (data.passed) {
        onSuccess(skill);
      }
    } catch (err) {
      setError("Failed to evaluate quiz. Please try again.");
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const evaluateQuiz = async (finalAnswers: { questionId: string; selectedIndex: number }[]) => {
    evaluateQuizWithAnswers(finalAnswers);
  };

  const handleRetry = () => {
    generateQuiz();
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setResult(null);
    setError(null);
    setTimeLeft(15);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[var(--theme-card-alt)] w-full max-w-2xl rounded-[2rem] p-8 border border-white/10 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black uppercase text-[#F0F4F2]">
                Skill Verification
              </h2>
              <p className="text-[var(--theme-accent)] text-sm mt-1">
                Prove your knowledge in <span className="font-bold">{skill}</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 bg-white/5 rounded-lg hover:bg-white/10"
            >
              <X size={16} className="text-[#F0F4F2]" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-16 text-center">
              <Loader2 className="animate-spin mx-auto mb-4 text-[var(--theme-accent)]" size={48} />
              <p className="text-[#F0F4F2]/70">Generating quiz questions...</p>
              <p className="text-[var(--theme-accent)]/50 text-sm mt-2">
                This may take a few seconds
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="py-16 text-center">
              <AlertTriangle className="mx-auto mb-4 text-red-400" size={48} />
              <p className="text-[#F0F4F2]/70 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 mx-auto hover:scale-105 transition-all"
              >
                <RefreshCw size={14} /> Try Again
              </button>
            </div>
          )}

          {/* Quiz Questions */}
          {!loading && !error && questions.length > 0 && !result && (
            <div>
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-[var(--theme-accent)] mb-2">
                  <span>Question {currentIndex + 1} of {questions.length}</span>
                  <div className="flex items-center gap-4">
                    <span>{Math.round(((currentIndex) / questions.length) * 100)}% Complete</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                      timeLeft <= 5 ? "bg-red-500/20 text-red-400" : "bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]"
                    }`}>
                      <Clock size={12} />
                      <span className="font-bold tabular-nums">{timeLeft}s</span>
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-[var(--theme-card)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-muted)] rounded-full"
                  />
                </div>
                {/* Timer bar */}
                <div className="h-1 bg-[var(--theme-card)] rounded-full overflow-hidden mt-2">
                  <motion.div
                    key={currentIndex}
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 15, ease: "linear" }}
                    className={`h-full rounded-full ${
                      timeLeft <= 5 ? "bg-red-500" : "bg-[var(--theme-accent)]"
                    }`}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="bg-[var(--theme-card)] p-6 rounded-2xl border border-white/5 mb-6">
                <p className="text-[#F0F4F2] text-lg font-medium">
                  {questions[currentIndex].question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {questions[currentIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={evaluating}
                    className="w-full text-left bg-[var(--theme-card)] border border-white/5 p-4 rounded-xl text-[#F0F4F2] hover:border-[var(--theme-accent)]/50 hover:bg-[var(--theme-accent)]/10 transition-all disabled:opacity-50"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] text-xs font-bold mr-3">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              {evaluating && (
                <div className="mt-6 text-center">
                  <Loader2 className="animate-spin mx-auto text-[var(--theme-accent)]" size={24} />
                  <p className="text-[#F0F4F2]/50 text-sm mt-2">Evaluating...</p>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {result && (
            <div>
              {/* Score Card */}
              <div className={`p-8 rounded-2xl text-center mb-6 ${
                result.passed 
                  ? "bg-gradient-to-br from-[var(--theme-accent)]/20 to-[var(--theme-muted)]/20 border border-[var(--theme-accent)]/30" 
                  : "bg-gradient-to-br from-red-500/10 to-red-900/10 border border-red-500/30"
              }`}>
                {result.passed ? (
                  <>
                    <Award className="mx-auto mb-4 text-[var(--theme-accent)]" size={64} />
                    <h3 className="text-2xl font-black text-[#F0F4F2] mb-2">
                      Congratulations!
                    </h3>
                    <p className="text-[var(--theme-accent)]">
                      You scored {result.score}/{result.total} and verified your {skill} skill!
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="mx-auto mb-4 text-red-400" size={64} />
                    <h3 className="text-2xl font-black text-[#F0F4F2] mb-2">
                      Not Quite There
                    </h3>
                    <p className="text-red-400">
                      You scored {result.score}/{result.total}. You need at least 4/5 to pass.
                    </p>
                  </>
                )}
              </div>

              {/* Detailed Results */}
              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-black text-[var(--theme-accent)] uppercase tracking-widest">
                  Question Review
                </h4>
                {result.results.map((r, idx) => (
                  <div
                    key={r.questionId}
                    className={`p-4 rounded-xl border ${
                      r.isCorrect 
                        ? "bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/30" 
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {r.isCorrect ? (
                        <CheckCircle className="text-[var(--theme-accent)] flex-shrink-0 mt-0.5" size={18} />
                      ) : (
                        <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                      )}
                      <div className="flex-1">
                        <p className="text-[#F0F4F2] text-sm font-medium mb-1">
                          Q{idx + 1}: {r.question}
                        </p>
                        {!r.isCorrect && (
                          <p className="text-xs text-[#F0F4F2]/50">
                            Correct answer: {questions.find(q => q.id === r.questionId)?.options[r.correctAnswer]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {!result.passed && (
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-4 bg-[var(--theme-accent)] text-[var(--theme-background)] rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} /> Try Again
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className={`py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all ${
                    result.passed 
                      ? "flex-1 bg-[var(--theme-accent)] text-[var(--theme-background)]" 
                      : "flex-1 bg-white/5 text-[#F0F4F2] border border-white/10"
                  }`}
                >
                  {result.passed ? "Done" : "Cancel"}
                </button>
              </div>
            </div>
          )}

          {/* Info */}
          {!loading && !error && questions.length === 0 && !result && (
            <div className="py-8 text-center">
              <p className="text-[#F0F4F2]/50">Preparing your quiz...</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
