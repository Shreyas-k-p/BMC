import React from 'react';
import { motion } from 'framer-motion';
import { Users, RotateCcw, CheckCircle2, ArrowRight } from 'lucide-react';
import { Group } from '../../types';

interface HostGroupsReviewProps {
  groups: Group[];
  totalParticipants: number;
  onRandomizeAgain: () => void;
  onConfirmTeams: () => void;
}

export const HostGroupsReview: React.FC<HostGroupsReviewProps> = ({
  groups,
  totalParticipants,
  onRandomizeAgain,
  onConfirmTeams,
}) => {
  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
              STAGE 02 • TEAM ASSIGNMENTS
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-white mt-1">
            TEAMS ARE READY
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {totalParticipants} students partitioned into {groups.length} balanced teams of 5 to 7 members.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRandomizeAgain}
            className="py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-display font-bold flex items-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>MAKE GROUPS AGAIN</span>
          </button>

          <button
            onClick={onConfirmTeams}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-display font-black text-xs tracking-wider uppercase flex items-center gap-2 transition shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>CONFIRM TEAMS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            className="bg-slate-900/85 border border-sky-500/25 hover:border-sky-400/50 rounded-3xl p-6 shadow-xl backdrop-blur-xl transition-all flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h3 className="font-display font-black text-2xl text-white">
                  {group.group_name}
                </h3>
                <div className="flex items-center gap-1 text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-bold text-white">{group.members.length} members</span>
                </div>
              </div>

              {/* Members List formatted as: 1. Arun — ECE */}
              <div className="space-y-2">
                {group.members.map((member, mIdx) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] text-xs font-medium"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="font-mono text-slate-500 text-xs w-4 text-right">
                        {mIdx + 1}.
                      </span>
                      <span className="text-slate-200 font-display font-semibold truncate">
                        {member.name}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-sky-400 flex-shrink-0">
                      — {member.department}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
