import React, { useState, useEffect, useRef } from 'react';
import { toHiragana } from 'wanakana';
import { Verb } from '../types';

interface Props {
  verbs: Verb[];
  onComplete: () => void;
}

const Quiz: React.FC<Props> = ({ verbs, onComplete }) => {
  const [currentVerb, setCurrentVerb] = useState<Verb | null>(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [streak, setStreak] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const getRank = (s: number) => {
    if (s >= 50) return { title: 'KAMI (God)', color: 'text-yellow-400', icon: '⚡' };
    if (s >= 30) return { title: 'SHOGUN', color: 'text-red-500', icon: '👹' };
    if (s >= 15) return { title: 'DAIMYO', color: 'text-purple-400', icon: '🏯' };
    if (s >= 5) return { title: 'SAMURAI', color: 'text-blue-400', icon: '⚔️' };
    return { title: 'ASHIGARU', color: 'text-slate-400', icon: '🦶' };
  };

  const rank = getRank(streak);

  // LOGIC: Select Verb
  const nextQuestion = () => {
    const activeVerbs = verbs.filter(v => v.is_active);
    if (activeVerbs.length === 0) return;

    const weighted = activeVerbs.map(v => {
      const rate = v.attempt_count === 0 ? 0 : v.correct_count / v.attempt_count;
      return { v, weight: 1 / (rate + 0.1) };
    });

    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    let selected = activeVerbs[0];
    
    for (const item of weighted) {
      random -= item.weight;
      if (random <= 0) { selected = item.v; break; }
    }
    
    setCurrentVerb(selected);
    setInput('');
    setFeedback('idle');
    // Re-focus input after a slight delay to ensure render is done
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Run once on mount
  useEffect(() => { nextQuestion(); }, [verbs]);

  // NEW: Global Key Listener for "Enter to Continue"
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only trigger if we are showing feedback and the key is Enter
      if (feedback !== 'idle' && e.key === 'Enter') {
        e.preventDefault();
        onComplete();
        nextQuestion();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [feedback, verbs]); // Dependencies ensure it grabs the latest state

  // LOGIC: Handle Input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = toHiragana(e.target.value, { IMEMode: true });
    setInput(newVal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVerb || feedback !== 'idle') return;

    // Normalize for check
    const normalizedInput = toHiragana(input);
    const correctKana = toHiragana(currentVerb.conj_kana);
    const correctKanji = currentVerb.conj_kanji;

    const isCorrect = normalizedInput === correctKana || input === correctKanji;

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) setStreak(s => s + 1);
    else setStreak(0);

    try {
      await fetch('http://localhost:3001/api/quiz/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentVerb.id, correct: isCorrect })
      });
    } catch (err) {
      console.error("Failed to save score:", err);
    }
  };

  if (!currentVerb) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
      <div className="text-4xl mb-4">⛩️</div>
      <p>The Dojo is empty.</p>
      <p className="text-sm">Activate verbs in the Grid to begin training.</p>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto mt-8">
      {/* HUD */}
      <div className="flex items-end justify-between mb-2 px-2">
        <div className={`text-sm font-bold tracking-widest ${rank.color} flex items-center gap-2`}>
          <span className="text-xl">{rank.icon}</span> {rank.title}
        </div>
        <div className="text-slate-400 font-mono text-sm">
          COMBO: <span className="text-white text-xl">{streak}</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 w-full bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 via-purple-500 to-red-500 transition-all duration-500"
          style={{ width: `${Math.min(streak * 2, 100)}%` }}
        />
      </div>

      {/* Main Card */}
      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] font-black text-white/5 pointer-events-none select-none">
          {currentVerb.dictionary_kanji}
        </div>

        <div className="relative z-10 p-12 text-center">
          <div className="mb-8">
            <h2 className="text-7xl font-black mb-4 text-white drop-shadow-lg tracking-wide">
              {currentVerb.dictionary_kanji}
            </h2>
            <div className="inline-block px-4 py-1 bg-slate-800 rounded text-slate-400 text-sm mb-6 border border-slate-700">
              {currentVerb.dictionary_kana} • {currentVerb.meaning}
            </div>
            
            <div className="flex items-center justify-center gap-3 text-lg">
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
              // FIX: We no longer disable the input, we just make it readOnly
              // This keeps focus alive (sometimes) but the Window Listener ensures Enter works regardless.
              readOnly={feedback !== 'idle'}
              className={`w-full bg-slate-950/80 backdrop-blur-sm border-b-4 text-center text-3xl py-4 outline-none transition-all font-medium
                ${feedback === 'idle' ? 'border-slate-700 focus:border-red-500 text-white placeholder:text-slate-700' : ''}
                ${feedback === 'correct' ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20' : ''}
                ${feedback === 'incorrect' ? 'border-red-500 text-red-500 bg-red-950/20' : ''}
                ${feedback !== 'idle' ? 'cursor-default' : ''} 
              `}
              placeholder="Type in Romaji..."
              autoFocus
            />
          </form>

          {/* Feedback Area */}
          <div className="h-24 mt-6 flex items-center justify-center">
            {feedback === 'correct' && (
              <div className="animate-bounce-in">
                <div className="text-emerald-400 font-bold text-xl tracking-wider mb-1">IPPON! (Correct)</div>
                <div className="text-slate-400 font-mono">{currentVerb.conj_kanji} / {currentVerb.conj_kana}</div>
                <div className="mt-2 text-xs uppercase tracking-widest text-slate-500 opacity-50">[ Press Enter ]</div>
              </div>
            )}
            {feedback === 'incorrect' && (
              <div className="animate-shake">
                <div className="text-red-500 font-bold text-xl tracking-wider mb-1">KILLED IN ACTION</div>
                <div className="text-slate-400">
                  Answer: <span className="text-white font-bold">{currentVerb.conj_kanji}</span>
                </div>
                <div className="text-slate-500 text-sm mt-1">
                 ({currentVerb.conj_kana})
                </div>
                <div className="mt-4 text-xs uppercase tracking-widest text-slate-500 opacity-50">[ Press Enter to Revive ]</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;