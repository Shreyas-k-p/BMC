import React from 'react';
import { Volume2, VolumeX, Maximize, Minimize, Users, Radio, Shield } from 'lucide-react';
import { SessionState } from '../../types';
import { getMuted, setMuted } from '../../lib/audio';

interface HostControlBarProps {
  joinCode: string;
  participantCount: number;
  currentStage: SessionState;
  onStageChange: (stage: SessionState) => void;
}

const STAGE_LABELS: Record<SessionState, string> = {
  LOBBY: 'Lobby',
  JOINING: '1. QR Join',
  GROUPING: '2. Grouping',
  GROUPS_READY: '3. Teams Ready',
  CAPTAIN_SELECTION: '4. Captains',
  PRODUCT_REVEAL: '5. Case Reveal',
  PRODUCT_ASSIGNMENT: '5. Case Reveal',
  PREPARATION: '6. 15m BMC Prep',
  STUDY_TIME: '7. 10m Study',
  PRESENTATION_ORDER: '8. Pitch Order',
  PRESENTATION: '9. Pitching (3m)',
  SCORING: '10. Scoring',
  LEADERBOARD: '11. Leaderboard',
  FINAL_RESULTS: '11. Leaderboard',
  COMPLETED: '12. Finished'
};

export const HostControlBar: React.FC<HostControlBarProps> = ({
  joinCode,
  participantCount,
  currentStage,
  onStageChange,
}) => {
  const [muted, setLocalMuted] = React.useState(getMuted());
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setLocalMuted(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 h-16 px-6 bg-slate-950/90 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between z-50 shadow-2xl">
      <div className="flex items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 p-0.5 shadow-lg shadow-sky-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="font-display font-black text-sm text-sky-400">BMC</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-base tracking-wide text-white">BMC LIVE</h1>
              <span className="text-[10px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">SNMIMT • IEDC & KSUM Classroom</div>
          </div>
        </div>

        {/* Live Pill & Code */}
        <div className="h-7 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 text-xs font-mono font-bold">
            <Radio className="w-3 h-3 animate-pulse" />
            LIVE
          </div>
          <div className="text-xs font-mono text-slate-300">
            CODE: <span className="font-extrabold text-sky-400 tracking-wider text-sm">{joinCode}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>{participantCount}</span>
          </div>
        </div>
      </div>

      {/* Stage Navigation Pills */}
      <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
        {(['JOINING', 'GROUPS_READY', 'CAPTAIN_SELECTION', 'PRODUCT_REVEAL', 'PREPARATION', 'STUDY_TIME', 'PRESENTATION_ORDER', 'PRESENTATION', 'LEADERBOARD'] as SessionState[]).map((stg) => {
          const isActive = currentStage === stg;
          return (
            <button
              key={stg}
              onClick={() => onStageChange(stg)}
              className={`px-3 py-1 rounded-lg text-xs font-display font-bold transition-all ${
                isActive
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {STAGE_LABELS[stg]}
            </button>
          );
        })}
      </nav>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1 hidden sm:flex">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>DEMO MODE</span>
        </div>

        <a
          href={`/join/${joinCode}`}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-mono font-bold flex items-center gap-1.5 transition"
          title="Open Student Mobile Screen in new tab for testing"
        >
          <span>📱 Student Tab</span>
        </a>

        <button
          onClick={toggleSound}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition"
          title={muted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
        </button>
        <button
          onClick={toggleFullscreen}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
