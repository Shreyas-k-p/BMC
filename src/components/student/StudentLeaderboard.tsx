import React from 'react';
import { Trophy, Crown, Medal, Sparkles } from 'lucide-react';
import { Group, Participant } from '../../types';

interface StudentLeaderboardProps {
  groups: Group[];
  currentParticipant: Participant;
}

export const StudentLeaderboard: React.FC<StudentLeaderboardProps> = ({ groups, currentParticipant }) => {
  const ranked = [...groups].sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
  const myGroup = groups.find((g) => g.id === currentParticipant.group_id);
  const myRank = myGroup ? ranked.findIndex((g) => g.id === myGroup.id) + 1 : null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-5 text-white max-w-md mx-auto pb-12 animate-fadeIn text-center">
      {/* Top Header */}
      <div className="pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>COMPETITION COMPLETE</span>
        </div>
        <h1 className="text-3xl font-display font-black text-white">CHAMPIONS CROWNED</h1>
        <p className="text-xs text-slate-400 mt-1">Look up at the main projector screen for the grand podium!</p>
      </div>

      {/* Winner Spotlight */}
      <div className="my-auto space-y-4">
        {ranked[0] && (
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-amber-950/40 border-2 border-amber-400 shadow-2xl shadow-amber-500/30 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center mb-2 shadow-lg">
              <Trophy className="w-8 h-8 fill-amber-400" />
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest">
              1ST PLACE • CHAMPIONS
            </span>
            <h2 className="text-2xl font-display font-black text-white mt-1">{ranked[0].group_name}</h2>
            <div className="text-xs text-amber-200 mt-0.5">{ranked[0].product?.name}</div>
            <div className="font-mono font-black text-3xl text-amber-400 mt-2">{ranked[0].final_score} pts</div>
          </div>
        )}

        {/* My Team's Rank Highlight */}
        {myGroup && myRank && (
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-sky-400/40 flex items-center justify-between text-xs text-left">
            <div>
              <div className="text-sky-300 font-mono font-bold text-[10px] uppercase">YOUR SQUAD RESULT</div>
              <div className="font-display font-bold text-white text-sm">{myGroup.group_name}</div>
              <div className="text-slate-400 text-[11px]">{myGroup.product?.name}</div>
            </div>
            <div className="text-right">
              <div className="font-display font-black text-2xl text-sky-400">#{myRank}</div>
              <div className="font-mono text-xs text-slate-300">{myGroup.final_score} pts</div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-slate-500 font-mono pt-3 border-t border-white/5">
        Congratulations to all participating engineering teams!
      </div>
    </div>
  );
};
