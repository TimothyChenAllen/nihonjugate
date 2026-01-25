import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toHiragana } from 'wanakana';
import { Verb } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Props {
  verbs: Verb[];
  onComplete: () => void;
}

const Quiz: React.FC<Props> = ({ verbs, onComplete }) => {
  const [currentVerb, setCurrentVerb] = useState<Verb | null>(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [streak, setStreak] = useState(0);
  
  const [showHint, setShowHint] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const getRank = (s: number) => {
    if (s >= 50) return { title: 'KAMI (God)', color: 'text-yellow-400', icon: '⚡' };
    if (s >= 30) return { title: 'SHOGUN', color: 'text-red-500', icon: '👹' };
    if (s >= 15) return { title: 'DAIMYO', color: 'text-purple-400', icon: '🏯' };
    if (s >= 5) return { title: 'SAMURAI', color: 'text-blue-400', icon: '⚔️' };
    return { title: 'ASHIGARU', color: 'text-slate-400', icon: '🦶' };
  };

  const rank = getRank(streak);

  const nextQuestion = useCallback(() => {
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
    setShowHint(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [verbs]);

  useEffect(() => { 
    if (!currentVerb && verbs.length > 0) {
      nextQuestion(); 
    }
  }, [verbs, nextQuestion, currentVerb]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (feedback !== 'idle' && e.key === 'Enter') {
        e.preventDefault();
        onComplete();
        nextQuestion();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [feedback, onComplete, nextQuestion]); 

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = toHiragana(e.target.value, { IMEMode: true });
    setInput(newVal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVerb || feedback !== 'idle') return;

    const cleanInput = input.trim();
    const normalizedInput = toHiragana(cleanInput);
    
    const correctKana = toHiragana(currentVerb.conj_kana);
    const correctKanji = currentVerb.conj_kanji;

    const isCorrect = normalizedInput === correctKana || cleanInput === correctKanji;

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    if (!isCorrect) setShowHint(true); 

    if (isCorrect) setStreak(s => s + 1);
    else setStreak(0);

    try {
      await fetch(`${API_URL}/quiz/result`, {
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
    // FIX 1 & 2: 
    // - justify-start: Anchors content to top on mobile (Fixes the gap & keyboard issue)
    // - md:justify-center: Keeps it centered on Desktop
    // - pt-4: Adds breathing room at the top on mobile so it's not glued to the header
    <div className="max-w-xl mx-auto min-h-[100dvh] flex flex-col justify-start md:justify-center p-4 pt-4 md:pt-0">
      
      <div className="flex-shrink-0">
        <div className="flex items-end justify-between mb-2 px-2">
          <div className={`text-sm font-bold tracking-widest ${rank.color} flex items-center gap-2`}>
            <span className="text-xl">{rank.icon}</span> {rank.title}
          </div>
          <div className="text-slate-400 font-mono text-sm">
            COMBO: <span className="text-white text-xl">{streak}</span>
          </div>
        </div>
        
        {/* FIX 3: Tighter margin (mb-2) on mobile to save vertical pixels */}
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

        <div className="relative z-10 p-6 md:p-12 text-center">
          <div className="mb-4 md:mb-8">
            <h2 className="text-5xl md:text-7xl font-black mb-2 md:mb-4 text-white drop-shadow-lg tracking-wide">
              {currentVerb.dictionary_kanji}
            </h2>
            
            <button 
              type="button"
              onClick={() => setShowHint(true)}
              className={`relative inline-block px-4 py-2 bg-slate-800 rounded text-slate-400 text-sm mb-4 md:mb-6 border border-slate-700 cursor-pointer transition-all duration-300 select-none hover:bg-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500`}
              title="Click to reveal definition"
              aria-label={showHint ? "Definition revealed" : "Click to reveal definition hint"}
              aria-pressed={showHint}
            >
              <span 
                aria-hidden={!showHint}
                className={`block transition-all duration-500 ${showHint ? 'filter-none opacity-100' : 'blur-md opacity-40'}`}
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
              readOnly={feedback !== 'idle'}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className={`w-full bg-slate-950/80 backdrop-blur-sm border-b-4 text-center text-2xl md:text-3xl py-3 md:py-4 outline-none transition-all font-medium
                ${feedback === 'idle' ? 'border-slate-700 focus:border-red-500 text-white placeholder:text-slate-700' : ''}
                ${feedback === 'correct' ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20' : ''}
                ${feedback === 'incorrect' ? 'border-red-500 text-red-500 bg-red-950/20' : ''}
                ${feedback !== 'idle' ? 'cursor-default' : ''} 
              `}
              placeholder="Type in Romaji..."
              autoFocus
            />
          </form>

          <div className="h-20 md:h-24 mt-4 md:mt-6 flex items-center justify-center">
            {feedback === 'correct' && (
              <div className="animate-bounce-in">
                <div className="text-emerald-400 font-bold text-lg md:text-xl tracking-wider mb-1">IPPON! (Correct)</div>
                <div className="text-slate-400 font-mono text-sm md:text-base">{currentVerb.conj_kanji} / {currentVerb.conj_kana}</div>
                <div className="mt-2 text-xs uppercase tracking-widest text-slate-500 opacity-50">[ Press Enter ]</div>
              </div>
            )}
            {feedback === 'incorrect' && (
              <div className="animate-shake">
                <div className="text-red-500 font-bold text-lg md:text-xl tracking-wider mb-1">KILLED IN ACTION</div>
                <div className="text-slate-400 text-sm md:text-base">
                  Answer: <span className="text-white font-bold">{currentVerb.conj_kanji}</span>
                </div>
                <div className="text-slate-500 text-xs md:text-sm mt-1">
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