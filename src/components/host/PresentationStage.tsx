import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, Square, Trophy, Shuffle, ArrowRight } from 'lucide-react';
import { Group, PeerScore } from '../../types';
import { BlindScoringPanel } from './BlindScoringPanel';
import { playUrgentTick, playTimeUpBuzzer } from '../../lib/audio';

interface PresentationStageProps {
  groups: Group[];
  currentGroupId: string | null | undefined;
  pitchStartedAt: string | null | undefined;
  pitchDuration: number; // default 180s (3 min)
  scoringOpen: boolean;
  peerScores: PeerScore[];
  totalParticipants: number;
  onGenerateOrder: () => void;
  onSelectGroup: (groupId: string) => void;
  onStartPitch: () => void;
  onPausePitch: (remaining: number) => void;
  onEndPitch: () => void;
  onSimulateCaptainScores?: (groupId: string) => void;
  onProceedToLeaderboard: () => void;
}

export const PresentationStage: React.FC<PresentationStageProps> = ({
  groups,
  currentGroupId,
  pitchStartedAt,
  pitchDuration,
  scoringOpen,
  peerScores,
  totalParticipants,
  onGenerateOrder,
  onSelectGroup,
  onStartPitch,
  onPausePitch,
  onEndPitch,
  onSimulateCaptainScores,
  onProceedToLeaderboard,
}) => {
  const [pitchRemainingSecs, setPitchRemainingSecs] = useState<number>(pitchDuration);
  const [isGeneratingOrder, setIsGeneratingOrder] = useState<boolean>(false);
  const prevSecRef = useRef<number>(pitchDuration);

  // Active presenting team
  const sortedGroups = [...groups].sort((a, b) => (a.presentation_order || 99) - (b.presentation_order || 99));
  const activeGroup = groups.find((g) => g.id === currentGroupId) || sortedGroups[0] || groups[0];

  const isPitchRunning = Boolean(pitchStartedAt);

  // Synchronized 3-minute pitch countdown from pitchStartedAt timestamp
  useEffect(() => {
    if (!pitchStartedAt) {
      setPitchRemainingSecs(pitchDuration);
      return;
    }

    const interval = setInterval(() => {
      const startMs = new Date(pitchStartedAt).getTime();
      const nowMs = Date.now();
      const elapsedSecs = Math.floor((nowMs - startMs) / 1000);
      const remaining = Math.max(0, pitchDuration - elapsedSecs);

      setPitchRemainingSecs(remaining);

      // 30 seconds warning
      if (remaining === 30 && prevSecRef.current !== 30) playUrgentTick();
      // 10 seconds countdown
      if (remaining <= 10 && remaining > 0 && prevSecRef.current !== remaining) playUrgentTick();
      // 0 TIME'S UP!
      if (remaining === 0 && prevSecRef.current !== 0) {
        playTimeUpBuzzer();
        onEndPitch();
      }

      prevSecRef.current = remaining;
    }, 250);

    return () => clearInterval(interval);
  }, [pitchStartedAt, pitchDuration, onEndPitch]);

  const handleShuffleClick = () => {
    setIsGeneratingOrder(true);
    setTimeout(() => {
      onGenerateOrder();
      setIsGeneratingOrder(false);
    }, 1500);
  };

  const minutes = Math.floor(pitchRemainingSecs / 60);
  const seconds = pitchRemainingSecs % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isWarning = pitchRemainingSecs <= 30 && pitchRemainingSecs > 10;
  const isFinalTen = pitchRemainingSecs <= 10 && pitchRemainingSecs > 0;
  const isTimeUp = pitchRemainingSecs === 0;

  const currentIdx = sortedGroups.findIndex((g) => g.id === activeGroup?.id);

  const completedCount = sortedGroups.filter(
    (g) => g.final_score !== null && g.final_score !== undefined
  ).length;

  const allCompleted = completedCount === sortedGroups.length && sortedGroups.length > 0;

  const handleNextTeam = () => {
    if (currentIdx < sortedGroups.length - 1) {
      onSelectGroup(sortedGroups[currentIdx + 1].id);
    } else {
      onProceedToLeaderboard();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Order Generation Loading Overlay */}
      {isGeneratingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center text-center">
          <Shuffle className="w-16 h-16 text-sky-400 animate-spin mb-4" />
          <h2 className="text-3xl font-display font-black text-white">
            GENERATING PRESENTATION ORDER...
          </h2>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
              STAGE 05 • 3-MINUTE PITCH STAGE
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-white mt-1">
            PRESENTATION TIME
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Strict 3-minute pitch per team with live peer scoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShuffleClick}
            className="py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-display font-bold flex items-center gap-2 transition"
          >
            <Shuffle className="w-4 h-4 text-sky-400" />
            <span>Randomize Order</span>
          </button>

          {allCompleted ? (
            <button
              onClick={onProceedToLeaderboard}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-display font-black text-xs tracking-wider uppercase flex items-center gap-2 transition shadow-xl shadow-amber-500/25 hover:scale-[1.02]"
            >
              <Trophy className="w-4 h-4 fill-slate-950" />
              <span>REVEAL LEADERBOARD</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-xs font-mono text-slate-400 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
              {completedCount} / {sortedGroups.length} COMPLETED
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Presentation Progress (Per Requirement 22) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-sky-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <h3 className="font-display font-black text-lg text-white">
              PRESENTATIONS
            </h3>
            <span className="text-xs font-mono font-bold text-sky-400">
              {completedCount} / {sortedGroups.length} COMPLETED
            </span>
          </div>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
            {sortedGroups.map((group, idx) => {
              const isCurrent = group.id === activeGroup?.id;
              const isCompleted = group.final_score !== null && group.final_score !== undefined;

              return (
                <div
                  key={group.id}
                  onClick={() => onSelectGroup(group.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isCurrent
                      ? 'bg-sky-500/20 border-sky-400/80 shadow-lg shadow-sky-500/20'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-base font-bold text-slate-300">
                      {isCompleted ? '✓' : isCurrent ? '→' : '○'}
                    </span>
                    <div className="truncate">
                      <div className={`font-display font-bold text-sm truncate ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                        {group.group_name}
                      </div>
                      {group.product && (
                        <div className="text-[11px] text-slate-400 truncate">
                          {group.product.name} ({group.product.company})
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Presenting Team Spotlight + 3-Min Pitch Clock */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {activeGroup ? (
            <>
              <div className="bg-slate-900/85 border border-sky-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                {/* Active Group Header */}
                <div className="border-b border-white/10 pb-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest mb-1">
                        NOW PRESENTING
                      </div>
                      <h2 className="font-display font-black text-4xl sm:text-5xl text-white">
                        {activeGroup.group_name}
                      </h2>
                    </div>

                    <div className="hidden sm:block text-right">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        PRESENTATION PROGRESS:
                      </div>
                      <div className="font-mono font-bold text-xs text-sky-400 mt-1">
                        {completedCount} / {sortedGroups.length} COMPLETED
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Presentation Progress Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1">
                    {sortedGroups.map((g) => {
                      const isDone = g.final_score !== null && g.final_score !== undefined;
                      const isCurrent = g.id === activeGroup.id;
                      return (
                        <span
                          key={g.id}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex-shrink-0 flex items-center gap-1 transition ${
                            isCurrent
                              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                              : isDone
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                              : 'bg-white/5 text-slate-400 border border-white/10'
                          }`}
                        >
                          {isDone ? '✓' : isCurrent ? '→' : '○'} {g.group_name}
                        </span>
                      );
                    })}
                  </div>

                  {activeGroup.product && (
                    <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          PRODUCT:
                        </div>
                        <div className="font-display font-black text-xl text-white">
                          {activeGroup.product.name}
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          COMPANY:
                        </div>
                        <div className="font-display font-bold text-base text-sky-400">
                          {activeGroup.product.company}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3-Minute Large Pitch Timer */}
                <div className="p-8 rounded-2xl bg-slate-950/70 border border-sky-500/20 flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-mono uppercase tracking-widest text-slate-400">
                    PRESENTATION TIMER
                  </div>

                  <div className="my-4">
                    {isTimeUp ? (
                      <div className="text-6xl sm:text-7xl font-display font-black text-rose-500 animate-pulse">
                        TIME'S UP!
                      </div>
                    ) : isFinalTen ? (
                      <div className="text-8xl sm:text-9xl font-mono font-black text-rose-400 animate-pulse">
                        {pitchRemainingSecs}
                      </div>
                    ) : (
                      <div
                        className={`font-mono font-black text-7xl sm:text-8xl tracking-tight transition-colors ${
                          isWarning ? 'text-amber-300 animate-pulse' : 'text-white'
                        }`}
                      >
                        {timeString}
                      </div>
                    )}

                    {isWarning && !isFinalTen && (
                      <div className="text-xs font-mono font-bold text-amber-400 mt-2 uppercase tracking-wider">
                        ⚠️ 30 SECONDS REMAINING
                      </div>
                    )}
                  </div>

                  {/* Host Controls */}
                  <div className="flex items-center gap-3 mt-4">
                    {!isPitchRunning ? (
                      <button
                        onClick={onStartPitch}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 font-display font-black text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-sky-500/30"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>START</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onPausePitch(pitchRemainingSecs)}
                        className="px-6 py-3 rounded-xl bg-amber-400 text-slate-950 font-display font-black text-xs tracking-wider uppercase flex items-center gap-2"
                      >
                        <Pause className="w-4 h-4 fill-slate-950" />
                        <span>PAUSE</span>
                      </button>
                    )}

                    <button
                      onClick={onEndPitch}
                      className="px-6 py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-display font-black text-xs tracking-wider uppercase flex items-center gap-2"
                    >
                      <Square className="w-4 h-4 fill-rose-300" />
                      <span>END PRESENTATION</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Blind Scoring Panel for Active Team */}
              <BlindScoringPanel
                currentGroup={activeGroup}
                groups={groups}
                peerScores={peerScores}
                onSimulateCaptainScores={onSimulateCaptainScores}
                onNextTeam={handleNextTeam}
              />
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900/80 rounded-3xl border border-white/10">
              No presenting team selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
