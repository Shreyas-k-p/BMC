import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { Group, PeerScore } from '../../types';

interface BlindScoringPanelProps {
  currentGroup: Group;
  groups: Group[];
  peerScores: PeerScore[];
  onSimulateCaptainScores?: (groupId: string) => void;
  onNextTeam: () => void;
}

export const BlindScoringPanel: React.FC<BlindScoringPanelProps> = ({
  currentGroup,
  groups,
  peerScores,
  onSimulateCaptainScores,
  onNextTeam,
}) => {
  // Eligible evaluator teams: all teams except the presenting team
  const eligibleEvaluatorGroups = groups.filter((g) => g.id !== currentGroup.id);
  const totalEligible = eligibleEvaluatorGroups.length;

  // Scores submitted for the current presenting team
  const groupScores = peerScores.filter((ps) => ps.group_id === currentGroup.id);
  const submittedCount = groupScores.length;
  const allSubmitted = submittedCount >= totalEligible && totalEligible > 0;

  // Calculate average strictly from submitted captain marks
  const peerAverage =
    submittedCount > 0
      ? (groupScores.reduce((acc, curr) => acc + curr.score, 0) / submittedCount).toFixed(1)
      : null;

  return (
    <div className="bg-slate-900/90 border border-sky-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest">
            {currentGroup.group_name} — SCORING
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-0.5">
            CAPTAIN RESPONSES
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Host Private View</span>
          </div>

          {onSimulateCaptainScores && !allSubmitted && (
            <button
              onClick={() => onSimulateCaptainScores(currentGroup.id)}
              className="py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-mono font-bold text-xs transition flex items-center gap-1.5 shadow"
              title="Simulate random 0-10 scores from demo captains"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Captain Scores</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Counter & Success Animation Banner */}
      <AnimatePresence mode="wait">
        {allSubmitted ? (
          <motion.div
            key="success-banner"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border-2 border-emerald-400/60 shadow-xl shadow-emerald-500/20 text-center flex flex-col items-center justify-center gap-1"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
              ✓
            </div>
            <h3 className="font-display font-black text-xl sm:text-2xl text-emerald-300 tracking-wide">
              ✓ ALL CAPTAINS HAVE SUBMITTED
            </h3>
            <p className="text-xs font-mono text-emerald-200">
              All {totalEligible} team captains have submitted their presentation scores.
            </p>
          </motion.div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-white/10">
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                CAPTAIN SUBMISSIONS:
              </div>
              <div className="font-mono font-black text-2xl text-amber-400 mt-0.5">
                {submittedCount} / {totalEligible} CAPTAINS SUBMITTED
              </div>
            </div>
            <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Live Updates Active</span>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Host Private View: Live Captain Status List */}
      <div className="space-y-3">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Captain Status Breakdown:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {eligibleEvaluatorGroups.map((evalGroup) => {
            const scoreRecord = groupScores.find((ps) => ps.evaluator_team_id === evalGroup.id);
            const hasSubmitted = Boolean(scoreRecord);

            return (
              <div
                key={evalGroup.id}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  hasSubmitted
                    ? 'bg-emerald-500/10 border-emerald-400/40 text-white'
                    : 'bg-amber-500/5 border-amber-400/20 text-slate-300'
                }`}
              >
                <div>
                  <div className="font-display font-black text-sm text-white flex items-center gap-2">
                    <span>{evalGroup.group_name} CAPTAIN</span>
                  </div>
                  {evalGroup.captain_name && (
                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      {evalGroup.captain_name}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {hasSubmitted ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>✓ SUBMITTED</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      <span>⏳ WAITING</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calculated Average */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-sky-500/30 flex items-center justify-between">
        <div>
          <div className="text-xs font-mono uppercase text-slate-400">Average Captain Score:</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Calculated strictly from captain marks (No Host Mark)
          </div>
        </div>

        <div className="font-mono font-black text-3xl text-sky-400">
          {peerAverage ? `${peerAverage} / 10` : '-- / 10'}
        </div>
      </div>

      {/* Next Team Action */}
      <div className="flex justify-end border-t border-white/10 pt-4">
        <button
          onClick={onNextTeam}
          className={`py-3.5 px-8 rounded-xl font-display font-black text-xs tracking-wider uppercase shadow-xl transition-all flex items-center gap-2 ${
            allSubmitted
              ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 hover:scale-[1.02] shadow-emerald-500/25'
              : 'bg-sky-500 hover:bg-sky-400 text-slate-950 hover:scale-[1.02]'
          }`}
        >
          <span>NEXT TEAM</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
