import React, { useState, useEffect } from 'react';
import Quiz from './components/Quiz';
import ConfigGrid from './components/ConfigGrid';
import { Verb } from './types';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [view, setView] = useState<'quiz' | 'config'>('config');
  const [verbs, setVerbs] = useState<Verb[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVerbs = async () => {
    const res = await fetch('http://localhost:3001/api/verbs');
    const data = await res.json();
    setVerbs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchVerbs();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-500 font-mono animate-pulse">
      INITIALIZING NIHONJUGATE...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-900 selection:text-white">
      {/* BRAND HEADER */}
      <nav className="border-b border-red-900/30 bg-gradient-to-r from-slate-900 to-slate-950 shadow-lg relative overflow-hidden">
        {/* Decorative 'Torii' top bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700"></div>
        
        <div className="container mx-auto px-6 py-4 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3 select-none cursor-pointer" onClick={() => setView('config')}>
            <div className="flex flex-col items-center justify-center w-10 h-10 bg-red-600 rounded text-slate-900 font-black text-xl leading-none shadow-red-500/20 shadow-lg">
              <span>日</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white">
                NIHON<span className="text-red-500">JUGATE</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                Tactical Verb Systems
              </p>
            </div>
          </div>

          <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setView('config')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                view === 'config' 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              GRID
            </button>
            <button 
              onClick={() => { fetchVerbs(); setView('quiz'); }}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                view === 'quiz' 
                  ? 'bg-red-600 text-white shadow-red-900/20 shadow-lg' 
                  : 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
              }`}
            >
              DUEL
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-6 max-w-5xl">
        {view === 'config' ? (
          <ConfigGrid verbs={verbs} onUpdate={fetchVerbs} />
        ) : (
          <ErrorBoundary> 
            <Quiz verbs={verbs} onComplete={() => fetchVerbs()} />
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}

export default App;