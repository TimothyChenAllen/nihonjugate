import React from 'react';
import { Verb } from '../types';

interface Props {
  verbs: Verb[];
  onUpdate: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ConfigGrid: React.FC<Props> = ({ verbs, onUpdate }) => {
  
  // Group by Dictionary Form
  const grouped = verbs.reduce((acc, verb) => {
    if (!acc[verb.dictionary_kanji]) acc[verb.dictionary_kanji] = [];
    acc[verb.dictionary_kanji].push(verb);
    return acc;
  }, {} as Record<string, Verb[]>);

  const toggleVerb = async (id: number, currentStatus: number) => {
    // Optimistic UI update could go here, but for now we wait for server
    await fetch(`${API_URL}/verbs/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !currentStatus })
    });
    onUpdate();
  };

  // NEW: Handle Bulk Actions
  const handleBulkAction = async (setActive: boolean) => {
    if (!confirm(setActive ? "Enable ALL verbs?" : "Disable ALL verbs? This will clear your current selection.")) return;
    
    await fetch(`${API_URL}/verbs/bulk-toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ set_active: setActive })
    });
    onUpdate();
  };

  const getMasteryColor = (v: Verb) => {
    if (!v.is_active) return 'bg-slate-900 border-slate-800 text-slate-600'; // Disabled (Darker, recessed)
    if (v.attempt_count === 0) return 'bg-slate-700 border-slate-600 text-white'; // Active, Untouched
    
    const rate = v.correct_count / v.attempt_count;
    if (rate >= 0.9 && v.attempt_count > 3) return 'bg-emerald-900 border-emerald-500 text-emerald-100'; // Mastered
    if (rate >= 0.7) return 'bg-blue-900 border-blue-500 text-blue-100'; // Good
    return 'bg-amber-900 border-amber-500 text-amber-100'; // Needs Work
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-slate-900 p-6 rounded-lg border border-red-900/30 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-red-500 tracking-widest uppercase">
            Mission Config
          </h2>

          {/* NEW: Bulk Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction(false)}
              className="px-3 py-1 text-xs font-bold border border-slate-600 text-slate-400 rounded hover:bg-slate-800 hover:text-white transition-colors"
            >
              DESELECT ALL
            </button>
            <button
              onClick={() => handleBulkAction(true)}
              className="px-3 py-1 text-xs font-bold border border-slate-600 text-slate-400 rounded hover:bg-slate-800 hover:text-white transition-colors"
            >
              SELECT ALL
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-700 border border-slate-600"></div>{" "}
            Active
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-900 border border-slate-800"></div>{" "}
            Inactive
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-900 border border-amber-500"></div>{" "}
            Struggling
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-900 border border-emerald-500"></div>{" "}
            Mastered
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(grouped).map(([kanji, forms]) => (
          <div
            key={kanji}
            className="bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-sm hover:border-slate-600 transition-colors"
          >
            <div className="p-3 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-2xl font-black mr-2 text-slate-200">
                  {kanji}
                </span>
                <span className="text-slate-500 text-sm font-mono">
                  ({forms[0].dictionary_kana})
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">
                {forms[0].meaning}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 p-2">
              {forms.map((v) => (
                <button
                  key={v.id}
                  onClick={() => toggleVerb(v.id, v.is_active)}
                  className={`p-2 text-xs text-left border rounded transition-all duration-200 flex flex-col h-full ${getMasteryColor(v)}`}
                >
                  {/* Header: Form Name */}
                  <div className="font-bold truncate w-full border-b border-white/10 pb-1 mb-1">
                    {v.form_name}
                  </div>

                  {/* Body: Kanji & Kana Answer Preview */}
                  <div className="mb-2">
                    <div className="text-sm font-medium truncate">
                      {v.conj_kanji}
                    </div>
                    <div className="text-[10px] opacity-80 truncate font-mono">
                      {v.conj_kana}
                    </div>
                  </div>

                  {/* Footer: Status */}
                  {v.is_active ? (
                    <div className="text-[10px] opacity-70 mt-auto">
                      {v.attempt_count > 0
                        ? `${Math.round((v.correct_count / v.attempt_count) * 100)}%`
                        : "READY"}
                    </div>
                  ) : (
                    <div className="text-[10px] opacity-30 mt-auto">
                      OFFLINE
                    </div>
                  )}
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