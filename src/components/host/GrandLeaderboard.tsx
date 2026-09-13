import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Sparkles, RotateCcw, Users, Flame } from 'lucide-react';
import { Group } from '../../types';
import { fireWinnerConfetti } from '../../lib/confetti';
import { playFanfare } from '../../lib/audio';

interface GrandLeaderboardProps {
  groups: Group[];
  onRestartSession: () => void;
}

export const GrandLeaderboard: React.FC<GrandLeaderboardProps> = ({ groups, onRestartSession }) => {
  const [revealStep, setRevealStep] = useState<'IDLE' | 'SUSPENSE' | 'REVEALED'>('IDLE');

  // Sort groups descending by final_score
  const rankedGroups = [...groups].sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

  const firstPlace = rankedGroups[0];
  const secondPlace = rankedGroups[1];
  const thirdPlace = rankedGroups[2];

  const handleStartReveal = () => {
    setRevealStep('SUSPENSE');
    setTimeout(() => {
      setRevealStep('REVEALED');
      playFanfare();
      fireWinnerConfetti();
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-16 animate-fadeIn text-center">
      {/* Before Reveal: ALL PRESENTATIONS COMPLETE */}
      {revealStep === 'IDLE' && (
        <div className="py-20 flex flex-col items-center justify-center max-w-xl mx-auto space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center shadow-2xl text-amber-400"
          >
            <Trophy className="w-12 h-12 fill-amber-400" />
          </motion.div>

          <div>
            <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest mb-1">
              SESSION COMPLETED
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-black text-white">
              ALL PRESENTATIONS COMPLETE
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              All pitch evaluations have been submitted by team captains.
            </p>
          </div>

          <button
            onClick={handleStartReveal}
            className="py-5 px-10 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-display font-black text-lg tracking-wider uppercase shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition flex items-center gap-3"
          >
            <Sparkles className="w-6 h-6 fill-slate-950" />
            <span>[ REVEAL LEADERBOARD ]</span>
          </button>
        </div>
      )}

      {/* Suspense Animation */}
      {revealStep === 'SUSPENSE' && (
        <div className="py-28 flex flex-col items-center justify-center space-y-6 animate-pulse">
          <Flame className="w-20 h-20 text-amber-400 animate-bounce" />
          <h2 className="text-3xl sm:text-5xl font-display font-black text-white tracking-widest uppercase">
            CALCULATING FINAL SCORES...
          </h2>
          <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 animate-pulse w-full"></div>
          </div>
        </div>
      )}

      {/* Revealed State: Dramatic Podium & Roster */}
      {revealStep === 'REVEALED' && (
        <div className="space-y-12 animate-fadeIn">
          {/* Header */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-3"
            >
              <Sparkles className="w-4 h-4" />
              <span>OFFICIAL FINAL STANDINGS</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-4xl sm:text-6xl font-display font-black text-white tracking-tight"
            >
              RESULTS ARE IN
            </motion.h1>
          </div>

          {/* Winning Team Champion Banner */}
          {firstPlace && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/60 border-2 border-amber-400 shadow-2xl shadow-amber-500/30 backdrop-blur-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 text-amber-400 opacity-20">
                <Trophy className="w-32 h-32 fill-amber-400" />
              </div>

              <div className="relative z-10 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center mx-auto shadow-xl shadow-amber-400/30">
                  <Trophy className="w-10 h-10 fill-amber-400" />
                </div>

                <div>
                  <div className="text-xs font-mono font-black text-amber-400 uppercase tracking-widest">
                    🥇 WINNING TEAM
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-display font-black text-white mt-1">
                    🏆 {firstPlace.group_name}
                  </h2>
                  <div className="font-mono font-black text-4xl text-amber-400 mt-2">
                    {firstPlace.final_score} / 10
                  </div>
                </div>

                {/* Animated Line-by-Line Winning Team Members */}
                <div className="pt-4 border-t border-white/10 text-left max-w-md mx-auto">
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>TEAM MEMBERS:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {firstPlace.members.map((member, idx) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + idx * 0.15 }}
                        className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs font-mono text-amber-200 flex items-center gap-2"
                      >
                        <span className="text-amber-400 font-bold">•</span>
                        <span className="font-bold text-white truncate">{member.name}</span>
                        <span className="text-[10px] text-amber-300 flex-shrink-0">— {member.department}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Top 3 Podium Cards (3rd, 2nd, 1st) */}
          <div className="flex flex-col sm:flex-row items-end justify-center gap-4 sm:gap-6 max-w-4xl mx-auto px-4 pt-4">
            {/* 2nd Place Silver */}
            {secondPlace && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full sm:w-1/3 order-2 sm:order-1 flex flex-col items-center"
              >
                <div className="bg-slate-900/90 border border-slate-400/40 rounded-3xl p-5 shadow-2xl backdrop-blur-xl w-full mb-3 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-400/20 text-slate-300 flex items-center justify-center mb-2 shadow-lg">
                    <Medal className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    🥈 2ND PLACE
                  </span>
                  <h3 className="font-display font-black text-2xl text-white mt-1 truncate max-w-full">
                    {secondPlace.group_name}
                  </h3>
                  <div className="font-mono font-black text-2xl text-slate-200 mt-2">
                    {secondPlace.final_score} / 10
                  </div>
                </div>
                <div className="w-full h-28 bg-gradient-to-b from-slate-700 to-slate-900 rounded-t-3xl border-t-2 border-slate-400 flex items-center justify-center shadow-2xl">
                  <span className="font-display font-black text-4xl text-slate-400">2</span>
                </div>
              </motion.div>
            )}

            {/* 1st Place Podium Stand */}
            {firstPlace && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="w-full sm:w-1/3 order-1 sm:order-2 flex flex-col items-center z-10"
              >
                <div className="w-full h-36 bg-gradient-to-b from-amber-500 to-amber-800 rounded-t-3xl border-t-4 border-amber-300 flex items-center justify-center shadow-2xl shadow-amber-500/40">
                  <span className="font-display font-black text-6xl text-amber-950">1</span>
                </div>
              </motion.div>
            )}

            {/* 3rd Place Bronze */}
            {thirdPlace && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="w-full sm:w-1/3 order-3 flex flex-col items-center"
              >
                <div className="bg-slate-900/90 border border-amber-700/40 rounded-3xl p-5 shadow-2xl backdrop-blur-xl w-full mb-3 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-700/20 text-amber-600 flex items-center justify-center mb-2 shadow-lg">
                    <Medal className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600">
                    🥉 3RD PLACE
                  </span>
                  <h3 className="font-display font-black text-2xl text-white mt-1 truncate max-w-full">
                    {thirdPlace.group_name}
                  </h3>
                  <div className="font-mono font-black text-2xl text-amber-500 mt-2">
                    {thirdPlace.final_score} / 10
                  </div>
                </div>
                <div className="w-full h-20 bg-gradient-to-b from-amber-800 to-slate-900 rounded-t-3xl border-t-2 border-amber-600 flex items-center justify-center shadow-2xl">
                  <span className="font-display font-black text-3xl text-amber-600">3</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Complete Ranking Table with Every Team's Members & Department */}
          <div className="max-w-4xl mx-auto px-4 mt-8 text-left">
            <div className="bg-slate-900/85 border border-sky-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="font-display font-black text-2xl text-white">
                    COMPLETE STANDINGS
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Full ranking of all participating teams and team members.
                  </p>
                </div>
                <button
                  onClick={onRestartSession}
                  className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold font-display flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start New Session</span>
                </button>
              </div>

              <div className="space-y-4">
                {rankedGroups.map((team, idx) => {
                  const rankMedal = idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `${idx + 1}.`;

                  return (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className={`p-5 rounded-2xl border flex flex-col gap-3 transition ${
                        idx === 0
                          ? 'bg-amber-500/10 border-amber-400/50'
                          : idx === 1
                          ? 'bg-slate-400/10 border-slate-400/30'
                          : idx === 2
                          ? 'bg-amber-700/10 border-amber-600/30'
                          : 'bg-white/[0.03] border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-display font-black text-xl text-amber-400 min-w-[50px]">
                            {rankMedal}
                          </span>
                          <h3 className="font-display font-black text-2xl text-white">
                            {team.group_name}
                          </h3>
                          {team.product && (
                            <span className="text-xs font-medium text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-400/20">
                              {team.product.name} ({team.product.company})
                            </span>
                          )}
                        </div>

                        <div className="font-mono font-black text-2xl text-sky-400">
                          {team.final_score ?? '--'} / 10
                        </div>
                      </div>

                      {/* Team Members List (Per Requirement) */}
                      <div className="pt-2 border-t border-white/10 pl-2">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                          MEMBERS:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {team.members.map((m) => (
                            <span
                              key={m.id}
                              className="text-xs font-mono text-slate-200 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                            >
                              <span className="text-slate-400">•</span>
                              <span className="font-bold">{m.name}</span>
                              <span className="text-[10px] text-sky-300 font-semibold">— {m.department}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
