import React, { useState, useEffect, useRef } from 'react';
import * as wanakana from 'wanakana';
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

  // Initialize Wanakana on the input field
  useEffect(() => {
    if (inputRef.current) {
      wanakana.bind(inputRef.current);
    }
    return () => {
      if (inputRef.current) wanakana.unbind(inputRef.current);
    };
  }, [currentVerb]);

  // Weighted Random Logic
  const nextQuestion = () => {
    const activeVerbs = verbs.filter(v => v.is_active);
    if (activeVerbs.length === 0) return;

    // Weight: 1 / (correct_rate + 0.1). 
    // Poorly scored items get higher weight.
    const weighted = activeVerbs.map(v => {
      const rate = v.attempt_count === 0 ? 0 : v.correct_count / v.attempt_count;
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
    setInput('');
    setFeedback('idle');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => {
    nextQuestion();
  }, [verbs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVerb || feedback !== 'idle') return;

    // Normalization for comparison
    // 1. Convert input to Hiragana (in case they pasted or typed mixed)
    // 2. Check against Conj_Kana OR Conj_Kanji
    const normalizedInput = wanakana.toHiragana(input);
    const correctKana = wanakana.toHiragana(currentVerb.conj_kana);
    const correctKanji = currentVerb.conj_kanji;

    // Check match
    const isCorrect = normalizedInput === correctKana || input === correctKanji;

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) setStreak(s => s + 1);
    else setStreak(0);

    // Save to DB
    await fetch('http://localhost:3001/api/quiz/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentVerb.id, correct: isCorrect })
    });
  };

  if (!currentVerb) return <div className="text-center mt-20 text-xl">Select some verbs in Config to start!</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10">
      
      {/* Score / Streak Header */}
      <div className="flex justify-between items-end mb-6 border-b border-slate-700 pb-2">
        <div className="text-slate-400">Streak: <span className="text-white text-xl font-mono">{streak}</span></div>
        <div className="text-xs uppercase tracking-widest text-slate-500">
          Rank: {streak > 20 ? 'SHOGUN' : streak > 10 ? 'SAMURAI' : streak > 5 ? 'RONIN' : 'NOVICE'}
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-10 shadow-xl border border-slate-700 text-center relative overflow-hidden">
        
        {/* Question Area */}
        <div className="mb-8">
          <h2 className="text-6xl font-black mb-2">{currentVerb.dictionary_kanji}</h2>
          <p className="text-slate-400 text-lg mb-6">{currentVerb.meaning} ({currentVerb.dictionary_kana})</p>
          <div className="inline-block bg-slate-900 px-4 py-1 rounded-full text-sm font-bold text-blue-300 border border-blue-900/50">
            Conjugate to: {currentVerb.form_name}
          </div>
        </div>

        {/* Answer Form */}
        <form onSubmit={handleSubmit} className="relative z-10">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={feedback !== 'idle'}
            className={`w-full bg-slate-900 border-2 text-center text-3xl py-4 rounded-xl outline-none transition-all
              ${feedback === 'idle' ? 'border-slate-600 focus:border-blue-500' : ''}
              ${feedback === 'correct' ? 'border-emerald-500 text-emerald-400' : ''}
              ${feedback === 'incorrect' ? 'border-red-500 text-red-400' : ''}
            `}
            placeholder="Type answer..."
            autoFocus
          />
        </form>

        {/* Feedback Overlay */}
        {feedback !== 'idle' && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {feedback === 'correct' ? (
              <div className="text-emerald-400">
                <div className="text-2xl font-bold mb-2">Correct!</div>
                <div className="text-slate-400">{currentVerb.conj_kanji} / {currentVerb.conj_kana}</div>
              </div>
            ) : (
              <div className="text-red-400">
                <div className="text-2xl font-bold mb-2">Incorrect</div>
                <div className="text-slate-300">
                  Correct answer: <span className="font-bold text-white mx-2">{currentVerb.conj_kanji}</span> or <span className="font-bold text-white mx-2">{currentVerb.conj_kana}</span>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => { onComplete(); nextQuestion(); }} // Trigger refresh to get updated weights
              className="mt-6 bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              Next Verb &rarr;
            </button>
          </div>
        )}
      </div>
      
      <div className="text-center mt-6 text-slate-500 text-sm">
        Input automatically converts to Hiragana. Type normally in Romaji.
      </div>
    </div>
  );
};

export default Quiz;