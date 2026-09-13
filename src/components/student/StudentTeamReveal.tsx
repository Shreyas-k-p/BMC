import React from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle2, Crown } from 'lucide-react';
import { Group, Participant } from '../../types';

interface StudentTeamRevealProps {
  groups: Group[];
  currentParticipant: Participant;
}

export const StudentTeamReveal: React.FC<StudentTeamRevealProps> = ({ groups = [], currentParticipant }) => {
  const myGroupId = currentParticipant?.group_id;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-6 text-white max-w-2xl mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="text-center pt-4 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider mb-3">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>ALL TEAMS FORMED</span>
        </div>
        <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">
          CLASSROOM TEAMS
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Review all teams formed by the host for this BMC live session.
        </p>
      </div>

      {/* Teams Grid */}
      <div className="space-y-6 my-auto">
        {groups.map((group, groupIdx) => {
          const isMyTeam = myGroupId ? group.id === myGroupId : group.members.some(m => m.id === currentParticipant?.id || m.name.toLowerCase() === currentParticipant?.name.toLowerCase());

          return (
            <motion.div
              key={group.id || groupIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIdx * 0.1 }}
              className={`p-5 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all ${
                isMyTeam
                  ? 'bg-slate-900/95 border-sky-400/60 ring-2 ring-sky-400/30 shadow-sky-500/10'
                  : 'bg-slate-900/60 border-white/10'
              }`}
            >
              {/* Group Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-display font-black text-white">
                    {group.group_name}
                  </span>
                  {isMyTeam && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-400 text-slate-950 uppercase tracking-wider">
                      YOUR TEAM
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  {group.members.length} Members
                </span>
              </div>

              {/* Captain Badge if assigned */}
              {group.captain_name && (
                <div className="mb-4 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/40 flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-[11px] font-mono font-bold text-amber-400 uppercase">
                    👑 CAPTAIN:
                  </span>
                  <span className="text-xs font-display font-bold text-white truncate">
                    {group.captain_name}
                  </span>
                </div>
              )}

              {/* Member List */}
              <div className="space-y-2">
                {group.members.map((member, mIdx) => {
                  const isMe = currentParticipant && (member.id === currentParticipant.id || member.name.toLowerCase() === currentParticipant.name.toLowerCase());
                  const isCaptain = group.captain_id === member.id;

                  return (
                    <div
                      key={member.id || mIdx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isCaptain
                          ? 'bg-amber-500/15 border-amber-400/50 text-white font-bold'
                          : isMe
                          ? 'bg-sky-500/15 border-sky-400/50 text-white font-bold'
                          : 'bg-white/[0.03] border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="font-mono text-slate-500 text-[11px] w-4">
                          {isCaptain ? '👑' : `${mIdx + 1}.`}
                        </span>
                        <span className="truncate">{member.name}</span>
                        {isMe && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-400 text-slate-950 uppercase">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-sky-300 uppercase">
                        {member.department}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] text-slate-400 text-center leading-relaxed font-mono mt-6">
        🔒 Classroom team configuration is read-only for participants.
      </div>

      <div className="text-center text-[11px] text-slate-600 font-mono pt-4 pb-2">
        BMC LIVE Classroom
      </div>
    </div>
  );
};

export default StudentTeamReveal;
