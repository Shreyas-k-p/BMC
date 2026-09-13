import React from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle2 } from 'lucide-react';
import { Group, Participant } from '../../types';

interface StudentTeamRevealProps {
  group: Group;
  currentParticipant: Participant;
}

export const StudentTeamReveal: React.FC<StudentTeamRevealProps> = ({ group, currentParticipant }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-6 text-white max-w-md mx-auto animate-fadeIn">
      {/* Top Tag */}
      <div className="text-center pt-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider mb-3">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>TEAMS FORMED</span>
        </div>
        <h1 className="text-2xl font-mono uppercase tracking-widest text-slate-400">
          YOUR TEAM
        </h1>
        <h2 className="text-5xl font-display font-black text-white mt-1">
          {group.group_name}
        </h2>
      </div>

      {/* Captain Banner */}
      {group.captain_name ? (
        <div className="my-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 shadow">
            👑
          </div>
          <div className="min-w-0 text-left">
            <div className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest">
              👑 CAPTAIN
            </div>
            <div className="font-display font-black text-lg text-white truncate">
              {group.captain_name}
            </div>
          </div>
        </div>
      ) : (
        <div className="my-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-300 text-center font-mono">
          Waiting for host to select team captain...
        </div>
      )}

      {/* Teammates List */}
      <div className="my-auto space-y-4">
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-sky-500/25 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-400" />
              Your team members ({group.members.length}):
            </span>
          </div>

          <div className="space-y-2.5">
            {group.members.map((member, idx) => {
              const isMe = member.id === currentParticipant.id || member.name.toLowerCase() === currentParticipant.name.toLowerCase();
              const isCaptain = group.captain_id === member.id;

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`p-3 rounded-xl border flex items-center justify-between text-sm ${
                    isCaptain
                      ? 'bg-amber-500/15 border-amber-400/50 text-white font-bold'
                      : isMe
                      ? 'bg-sky-500/15 border-sky-400/50 text-white font-bold'
                      : 'bg-white/[0.03] border-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="font-mono text-slate-500 text-xs w-5">
                      {isCaptain ? '👑' : `${idx + 1}.`}
                    </span>
                    <span className="truncate">{member.name}</span>
                    {isMe && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-400 text-slate-950 uppercase">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/5 text-sky-300 uppercase">
                    {member.department}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] text-slate-400 text-center leading-relaxed font-mono">
          🔒 Captain selection is managed exclusively by the host.
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-600 font-mono pb-2">
        BMC LIVE Classroom
      </div>
    </div>
  );
};
