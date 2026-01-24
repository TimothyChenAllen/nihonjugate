import React, { useState, useEffect } from 'react';
import Quiz from './components/Quiz';
import ConfigGrid from './components/ConfigGrid';
import { Verb } from './types';

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

  if (loading) return <div className="p-10">Loading Dojo...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <nav className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-red-400 tracking-wider">VERB DOJO</h1>
        <div className="space-x-4">
          <button 
            onClick={() => setView('config')}
            className={`px-4 py-2 rounded ${view === 'config' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Config & Progress
          </button>
          <button 
            onClick={() => { fetchVerbs(); setView('quiz'); }}
            className={`px-4 py-2 rounded font-bold ${view === 'quiz' ? 'bg-red-600 text-white' : 'bg-red-900/50 text-red-200 hover:bg-red-800'}`}
          >
            Start Quiz
          </button>
        </div>
      </nav>

      <main className="container mx-auto p-6">
        {view === 'config' ? (
          <ConfigGrid verbs={verbs} onUpdate={fetchVerbs} />
        ) : (
          <Quiz verbs={verbs} onComplete={() => fetchVerbs()} />
        )}
      </main>
    </div>
  );
}

export default App;