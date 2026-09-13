import React from 'react';
import { motion } from 'framer-motion';
import { Crown, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { Group } from '../../types';

interface CaptainSelectionProps {
  groups: Group[];
  onSelectCaptain: (groupId: string, participantId: string) => void;
  onProceedToProducts: () => void;
}

export const CaptainSelection: React.FC<CaptainSelectionProps> = ({
  groups,
  onSelectCaptain,
  onProceedToProducts,
}) => {
  // Check if every team has selected a captain
  const allCaptainsSelected = groups.every(
    (g) => g.captain_id !== null && g.captain_id !== undefined && g.captain_id !== ''
  );

  const selectedCount = groups.filter((g) => Boolean(g.captain_id)).length;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              STAGE 03 • CAPTAIN DESIGNATION
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-white mt-1">
            CAPTAIN SELECTION
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Select one student captain for each team. Captains hold the exclusive privilege to submit peer evaluations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-slate-300 bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-xl">
            {selectedCount} / {groups.length} CAPTAINS SELECTED
          </div>

          <button
            onClick={onProceedToProducts}
            disabled={!allCaptainsSelected}
            className={`py-3 px-6 rounded-xl font-display font-black text-xs tracking-wider uppercase flex items-center gap-2 transition shadow-lg ${
              allCaptainsSelected
                ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <span>CONFIRM CAPTAINS & ASSIGN PRODUCTS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!allCaptainsSelected && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Every team must have exactly one designated captain before continuing to product assignments.</span>
        </div>
      )}

      {/* Teams Grid for Captain Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group, idx) => {
          const hasCaptain = Boolean(group.captain_id);

          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`rounded-3xl p-6 shadow-xl backdrop-blur-xl transition-all flex flex-col justify-between border ${
                hasCaptain
                  ? 'bg-slate-900/90 border-amber-400/40 shadow-amber-500/10'
                  : 'bg-slate-900/80 border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                {/* Team Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <h3 className="font-display font-black text-2xl text-white">
                    {group.group_name}
                  </h3>
                  {hasCaptain ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>CAPTAIN SET</span>
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-500">
                      Captain needed
                    </span>
                  )}
                </div>

                {/* Designated Captain Banner */}
                {hasCaptain && (
                  <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/40 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 shadow">
                      <Crown className="w-5 h-5 fill-slate-950" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest">
                        👑 CAPTAIN
                      </div>
                      <div className="font-display font-black text-base text-white truncate">
                        {group.captain_name}
                      </div>
                    </div>
                  </div>
                )}

                {/* Member Roster with Selection Buttons */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Select Member as Captain:
                  </div>

                  {group.members.map((member) => {
                    const isCaptain = group.captain_id === member.id;

                    return (
                      <div
                        key={member.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isCaptain
                            ? 'bg-amber-500/15 border-amber-400/50 text-white font-bold'
                            : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-mono text-xs text-slate-400">
                            {isCaptain ? '👑' : '○'}
                          </span>
                          <span className="truncate font-display font-medium text-sm">
                            {member.name}
                          </span>
                          <span className="text-xs font-mono text-sky-400 flex-shrink-0">
                            — {member.department}
                          </span>
                          {member.is_demo && (
                            <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 flex-shrink-0">
                              DEMO
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => onSelectCaptain(group.id, member.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex-shrink-0 ${
                            isCaptain
                              ? 'bg-amber-400 text-slate-950 shadow'
                              : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                          }`}
                        >
                          {isCaptain ? '👑 CAPTAIN' : 'SELECT AS CAPTAIN'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
