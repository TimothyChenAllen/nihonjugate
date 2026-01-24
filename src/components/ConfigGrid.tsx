import React from 'react';
import { Verb } from '../types';

interface Props {
  verbs: Verb[];
  onUpdate: () => void;
}

const ConfigGrid: React.FC<Props> = ({ verbs, onUpdate }) => {
  
  // Group by Dictionary Form for easier layout
  const grouped = verbs.reduce((acc, verb) => {
    if (!acc[verb.dictionary_kanji]) acc[verb.dictionary_kanji] = [];
    acc[verb.dictionary_kanji].push(verb);
    return acc;
  }, {} as Record<string, Verb[]>);

  const toggleVerb = async (id: number, currentStatus: number) => {
    await fetch('http://localhost:3001/api/verbs/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !currentStatus })
    });
    onUpdate();
  };

  const getMasteryColor = (v: Verb) => {
    if (!v.is_active) return 'bg-slate-800 border-slate-700 opacity-50'; // Disabled
    if (v.attempt_count === 0) return 'bg-slate-700 border-slate-600'; // Untouched
    
    const rate = v.correct_count / v.attempt_count;
    if (rate >= 0.9 && v.attempt_count > 3) return 'bg-emerald-900 border-emerald-500 text-emerald-100'; // Mastered
    if (rate >= 0.7) return 'bg-blue-900 border-blue-500 text-blue-100'; // Good
    return 'bg-amber-900 border-amber-500 text-amber-100'; // Needs Work
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <h2 className="text-xl font-bold mb-4">Training Configuration</h2>
        <div className="flex gap-4 text-sm mb-4">
          <span className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-700 border border-slate-600"></div> Not Started</span>
          <span className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-900 border border-amber-500"></div> Struggling</span>
          <span className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-900 border border-emerald-500"></div> Mastered</span>
          <span className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-800 border border-slate-700 opacity-50"></div> Inactive</span>
        </div>
        <p className="text-slate-400">Click a cell to toggle it for the quiz.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(grouped).map(([kanji, forms]) => (
          <div key={kanji} className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
            <div className="p-3 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
              <div>
                <span className="text-2xl font-bold mr-2">{kanji}</span>
                <span className="text-slate-400 text-sm">({forms[0].dictionary_kana})</span>
              </div>
              <span className="text-xs text-slate-500">{forms[0].meaning}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 p-2">
              {forms.map(v => (
                <button
                  key={v.id}
                  onClick={() => toggleVerb(v.id, v.is_active)}
                  className={`p-2 text-xs text-left border rounded transition-all ${getMasteryColor(v)}`}
                >
                  <div className="font-semibold truncate">{v.form_name}</div>
                  <div className="text-[10px] opacity-70">
                    {v.correct_count}/{v.attempt_count}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfigGrid;