import React, { useState, useEffect, useRef, useCallback } from "react";
import { toHiragana } from "wanakana";
import { Verb } from "../types";
import { getRule, getUsage, getApplication } from "../utils/rules";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface Props {
  verbs: Verb[];
  onComplete: () => void;
  autoPlay: boolean;
  toggleAutoPlay: () => void;
}

const playPronunciation = (text: string) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
};

const AudioButton: React.FC<{ text: string }> = ({ text }) => {
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playPronunciation(text);
  };

  return (
    <button
      type="button"
      onClick={handlePlay}
      aria-label="Pronounce answer"
      className="inline-flex items-center justify-center p-2 rounded-full ml-2 opacity-70 hover:opacity-100 hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-current text-current cursor-pointer"
      title="Play pronunciation"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6 md:w-5 md:h-5"
      >
        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 2.485.519 4.814 1.442 6.896.26 1.259 1.488 1.604 2.566 1.604h1.932l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
        <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
      </svg>
    </button>
  );
};

const RuleFormatter: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/'([^']+)'/g);
  return (
    <p className="leading-relaxed">
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          return (
            <span
              key={i}
              className="inline-block px-1.5 py-0.5 mx-0.5 font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 rounded-md shadow-sm whitespace-nowrap"
            >
              {part}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </p>
  );
};

const Quiz: React.FC<Props> = ({
  verbs,
  onComplete,
  autoPlay,
  toggleAutoPlay,
}) => {
  const [currentVerb, setCurrentVerb] = useState<Verb | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">(
    "idle",
  );
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const getRank = (s: number) => {
    if (s >= 50)
      return { title: "KAMI (God)", color: "text-yellow-400", icon: "⚡" };
    if (s >= 30) return { title: "SHOGUN", color: "text-red-500", icon: "👹" };
    if (s >= 15)
      return { title: "DAIMYO", color: "text-purple-400", icon: "🏯" };
    if (s >= 5) return { title: "SAMURAI", color: "text-blue-400", icon: "⚔️" };
    return { title: "ASHIGARU", color: "text-slate-400", icon: "🦶" };
  };

  const rank = getRank(streak);

  const nextQuestion = useCallback(() => {
    const activeVerbs = verbs.filter((v) => v.is_active);
    if (activeVerbs.length === 0) return;

    const weighted = activeVerbs.map((v) => {
      const rate =
        v.attempt_count === 0 ? 0 : v.correct_count / v.attempt_count;
      return { v, weight: 1 / (rate + 0.1) };
    });

    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    let selected = activeVerbs[0];

    for (const item of weighted) {
      random -= item.weight;
      if (random <= 0) {
        selected = item.v;
        break;
      }
    }

    setCurrentVerb(selected);
    setInput("");
    setFeedback("idle");
    setShowHint(false);
    setShowRuleModal(false);
  }, [verbs]);

  const handleNext = () => {
    if (inputRef.current) {
      inputRef.current.readOnly = false;
      inputRef.current.focus();
    }
    onComplete();
    nextQuestion();
  };

  useEffect(() => {
    if (!currentVerb && verbs.length > 0) {
      nextQuestion();
    }
  }, [verbs, nextQuestion, currentVerb]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (feedback !== "idle" && !showRuleModal && e.key === "Enter") {
        e.preventDefault();
        handleNext();
      }
      if (showRuleModal && e.key === "Escape") {
        setShowRuleModal(false);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [feedback, handleNext, showRuleModal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = toHiragana(e.target.value, { IMEMode: true });
    setInput(newVal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVerb || feedback !== "idle") return;

    const cleanInput = input.trim();
    const normalizedInput = toHiragana(cleanInput);
    const correctKana = toHiragana(currentVerb.conj_kana);
    const correctKanji = currentVerb.conj_kanji;
    const isCorrect =
      normalizedInput === correctKana || cleanInput === correctKanji;

    setFeedback(isCorrect ? "correct" : "incorrect");
    setShowHint(true);
    if (isCorrect) setStreak((s) => s + 1);
    else setStreak(0);

    if (autoPlay) {
      playPronunciation(currentVerb.conj_kana);
    }

    try {
      await fetch(`${API_URL}/quiz/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentVerb.id, correct: isCorrect }),
      });
    } catch (err) {
      console.error("Failed to save score:", err);
    }
  };

  if (!currentVerb)
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <div className="text-4xl mb-4">⛩️</div>
        <p>The Dojo is empty.</p>
      </div>
    );

  return (
    <>
      <div className="max-w-xl mx-auto min-h-[100dvh] flex flex-col justify-start md:justify-center p-4 pt-16 md:pt-0">
        <div className="flex-shrink-0">
          <div className="flex items-end justify-between mb-2 px-2">
            <div
              className={`text-sm font-bold tracking-widest ${rank.color} flex items-center gap-2`}
            >
              <span className="text-xl">{rank.icon}</span> {rank.title}
            </div>
            <div className="text-slate-400 font-mono text-sm">
              COMBO: <span className="text-white text-xl">{streak}</span>
            </div>
          </div>

          <div className="h-1 w-full bg-slate-800 rounded-full mb-2 md:mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-purple-500 to-red-500 transition-all duration-500"
              style={{ width: `${Math.min(streak * 2, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative w-full">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8rem] md:text-[15rem] font-black text-white/5 pointer-events-none select-none">
            {currentVerb.dictionary_kanji}
          </div>

          <div className="relative z-10 p-4 md:p-12 text-center">
            <div className="mb-2 md:mb-8">
              <h2 className="text-4xl md:text-7xl font-black mb-2 md:mb-4 text-white drop-shadow-lg tracking-wide">
                {currentVerb.dictionary_kanji}
              </h2>

              <button
                type="button"
                onClick={() => setShowHint(true)}
                className={`relative inline-block px-4 py-2 bg-slate-800 rounded text-slate-400 text-sm mb-2 md:mb-6 border border-slate-700 cursor-pointer transition-all duration-300 select-none hover:bg-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500`}
              >
                <span
                  className={`block transition-all duration-500 ${showHint ? "filter-none opacity-100" : "blur-md opacity-40"}`}
                >
                  {currentVerb.dictionary_kana} • {currentVerb.meaning}
                </span>
                {!showHint && (
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest text-red-500/50 font-bold pointer-events-none">
                    [ Encrypted ]
                  </span>
                )}
              </button>

              <div className="flex items-center justify-center gap-3 text-base md:text-lg">
                <span className="text-slate-500">Form:</span>
                <span className="font-bold text-red-400 border-b-2 border-red-900/50 pb-0.5">
                  {currentVerb.form_name}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                readOnly={feedback !== "idle"}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className={`w-full bg-slate-950/80 backdrop-blur-sm border-b-4 text-center text-2xl md:text-3xl py-3 md:py-4 outline-none transition-all font-medium
                  ${feedback === "idle" ? "border-slate-700 focus:border-red-500 text-white placeholder:text-slate-700" : ""}
                  ${feedback === "correct" ? "border-emerald-500 text-emerald-400 bg-emerald-950/20" : ""}
                  ${feedback === "incorrect" ? "border-red-500 text-red-500 bg-red-950/20" : ""}
                  ${feedback !== "idle" ? "cursor-default" : ""}
                `}
                placeholder="Type in Romaji..."
                autoFocus
              />
            </form>

            <div className="min-h-[6rem] mt-4 flex flex-col items-center justify-center">
              {feedback === "correct" && (
                <div className="animate-bounce-in flex flex-col items-center w-full">
                  <div className="text-emerald-400 font-bold text-lg md:text-xl tracking-wider mb-1">
                    IPPON! (Correct)
                  </div>
                  <div className="text-slate-400 font-mono text-sm md:text-base flex items-center gap-1">
                    {currentVerb.conj_kanji} / {currentVerb.conj_kana}
                    <AudioButton text={currentVerb.conj_kana} />
                    <label
                      className="flex items-center cursor-pointer gap-1.5 ml-1 text-[10px] text-emerald-600/70 hover:text-emerald-400 transition-colors"
                      title="Auto-play pronunciation"
                    >
                      <input
                        type="checkbox"
                        checked={autoPlay}
                        onChange={toggleAutoPlay}
                        className="sr-only"
                      />
                      <div
                        className={`w-6 h-3.5 rounded-full transition-colors ${autoPlay ? "bg-emerald-500/70" : "bg-slate-700"} relative`}
                      >
                        <div
                          className={`absolute top-[2px] left-[2px] w-2.5 h-2.5 bg-white rounded-full transition-transform ${autoPlay ? "translate-x-2.5" : "translate-x-0"}`}
                        ></div>
                      </div>
                      AUTO
                    </label>
                  </div>

                  <div className="flex gap-2 mt-3 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => setShowRuleModal(true)}
                      className="flex-1 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded text-emerald-400 font-bold tracking-widest text-sm transition-all active:scale-95 whitespace-nowrap"
                    >
                      💡 RULE
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded text-emerald-400 font-bold tracking-widest text-sm transition-all active:scale-95"
                    >
                      NEXT ❯
                    </button>
                  </div>
                </div>
              )}

              {feedback === "incorrect" && (
                <div className="animate-shake flex flex-col items-center w-full">
                  <div className="text-red-500 font-bold text-lg md:text-xl tracking-wider mb-1">
                    KILLED IN ACTION
                  </div>
                  <div className="text-slate-400 text-sm md:text-base">
                    Answer:{" "}
                    <span className="text-white font-bold">
                      {currentVerb.conj_kanji}
                    </span>
                  </div>
                  <div className="text-slate-500 text-xs md:text-sm mt-1 flex items-center justify-center gap-1">
                    ({currentVerb.conj_kana})
                    <AudioButton text={currentVerb.conj_kana} />
                    <label
                      className="flex items-center cursor-pointer gap-1.5 ml-1 text-[10px] text-red-500/70 hover:text-red-400 transition-colors"
                      title="Auto-play pronunciation"
                    >
                      <input
                        type="checkbox"
                        checked={autoPlay}
                        onChange={toggleAutoPlay}
                        className="sr-only"
                      />
                      <div
                        className={`w-6 h-3.5 rounded-full transition-colors ${autoPlay ? "bg-red-500/70" : "bg-slate-700"} relative`}
                      >
                        <div
                          className={`absolute top-[2px] left-[2px] w-2.5 h-2.5 bg-white rounded-full transition-transform ${autoPlay ? "translate-x-2.5" : "translate-x-0"}`}
                        ></div>
                      </div>
                      AUTO
                    </label>
                  </div>

                  <div className="flex gap-2 mt-3 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => setShowRuleModal(true)}
                      className="flex-1 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded text-amber-400 font-bold tracking-widest text-sm transition-all active:scale-95 whitespace-nowrap"
                    >
                      💡 RULE
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-red-400 font-bold tracking-widest text-sm transition-all active:scale-95"
                    >
                      CONTINUE ❯
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRuleModal && currentVerb && (
        <div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={() => setShowRuleModal(false)}
        >
          <div
            className="w-full max-w-xl bg-slate-900 border-t md:border border-slate-700 md:rounded-xl rounded-t-2xl shadow-2xl p-6 pb-12 md:pb-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-amber-400 font-bold tracking-widest uppercase text-sm mb-1">
                  Grammar Data
                </h3>
                <h4 className="text-white text-xl font-bold">
                  {currentVerb.form_name}
                </h4>
                <div className="text-slate-400 text-sm mt-1">
                  Class:{" "}
                  <span className="text-slate-200">
                    {currentVerb.verb_class}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowRuleModal(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-300">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Usage
                </h5>
                <p className="text-sm leading-relaxed">
                  {getUsage(currentVerb.form_name)}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-300">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Rule
                </h5>
                <div className="text-base md:text-lg">
                  <RuleFormatter
                    text={getRule(
                      currentVerb.verb_class,
                      currentVerb.form_name,
                      currentVerb.dictionary_kanji,
                    )}
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-300">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Application
                </h5>
                <div className="font-mono text-emerald-400 text-center py-3 bg-black/50 rounded border border-emerald-900/30 text-lg md:text-xl">
                  {getApplication(currentVerb)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowRuleModal(false)}
              className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Quiz;
