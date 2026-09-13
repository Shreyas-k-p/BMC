import React, { useState } from 'react';
import { Sparkles, ArrowRight, Play, Trophy, Users, Clock } from 'lucide-react';

interface HostLandingProps {
  onCreateSession: (code?: string) => void;
  onJoinSession: (code: string) => void;
}

export const HostLanding: React.FC<HostLandingProps> = ({ onCreateSession, onJoinSession }) => {
  const [customCode, setCustomCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);

  const handleCustomCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCode.trim()) {
      onCreateSession(customCode.trim());
    } else {
      onCreateSession();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-sky-600/20 via-cyan-500/10 to-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-sky-950/40 to-transparent pointer-events-none"></div>

      <div className="max-w-3xl w-full text-center relative z-10">
        {/* College / Institution Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/15 backdrop-blur-xl text-sky-400 text-xs font-mono font-bold tracking-wider uppercase mb-8 shadow-xl">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>SNMIMT MALIANJARA • IEDC & KSUM WORKSHOP</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display font-black text-6xl sm:text-7xl md:text-8xl tracking-tight text-white leading-none">
          BMC <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-fill-transparent text-transparent">LIVE</span>
        </h1>

        {/* Tagline */}
        <div className="mt-4 font-display font-extrabold text-2xl sm:text-3xl tracking-widest text-slate-200 uppercase">
          BUILD. COMPETE. PITCH. WIN.
        </div>

        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-xl mx-auto font-normal leading-relaxed">
          The real-time gamified Business Model Canvas competition. Turn engineering students into startup founders in a live interactive classroom hackathon.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onCreateSession()}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 text-slate-950 font-display font-black text-lg tracking-wide shadow-xl shadow-sky-500/30 hover:shadow-sky-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>CREATE NEW SESSION</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowCodeInput(!showCodeInput)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-display font-bold text-lg tracking-wide backdrop-blur-xl transition hover:border-white/30"
          >
            CUSTOM JOIN CODE
          </button>
        </div>

        {showCodeInput && (
          <form onSubmit={handleCustomCreate} className="mt-6 flex items-center justify-center gap-3 max-w-md mx-auto animate-fadeIn">
            <input
              type="text"
              placeholder="e.g. BMC2026"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-sky-500/40 text-white font-mono uppercase text-center font-bold tracking-widest focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-sky-500 text-slate-950 font-bold font-display hover:bg-sky-400 transition"
            >
              LAUNCH
            </button>
          </form>
        )}

        {/* Feature Highlights Cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-display font-bold text-white text-base">Smart Grouping</h4>
            <p className="text-xs text-slate-400 mt-1">
              Automatic 5–7 member team balancing across engineering departments with curious slot shuffle.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-display font-bold text-white text-base">Synchronized Clocks</h4>
            <p className="text-xs text-slate-400 mt-1">
              Server-authoritative 15-minute preparation and 3-minute pitch timers synced across phones & projector.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <Trophy className="w-5 h-5" />
            </div>
            <h4 className="font-display font-bold text-white text-base">Blind Scoring & Podium</h4>
            <p className="text-xs text-slate-400 mt-1">
              Secret peer scores with live averages hidden for suspense until the grand Olympic podium reveal!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
