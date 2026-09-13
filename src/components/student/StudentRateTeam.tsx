import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Lock, Clock, Sparkles } from 'lucide-react';
import { Group, Participant } from '../../types';

interface StudentRateTeamProps {
  presentingGroup: Group;
  currentParticipant: Participant;
  alreadySubmitted: boolean;
  onSubmitScore: (score: number) => void;
}

export const StudentRateTeam: React.FC<StudentRateTeamProps> = ({
  presentingGroup,
  currentParticipant,
  alreadySubmitted,
  onSubmitScore,
}) => {
  const [selectedScore, setSelectedScore] = useState<number | null>(8);
  const [submitted, setSubmitted] = useState(alreadySubmitted);

  const isCaptain = Boolean(currentParticipant.is_captain);
  const isMyGroup = currentParticipant.group_id === presentingGroup.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCaptain || isMyGroup || selectedScore === null) return;
    onSubmitScore(selectedScore);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-6 text-white max-w-md mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="text-center pt-4">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400 mb-1">
          NOW PRESENTING
        </div>
        <h1 className="text-3xl font-display font-black text-white">
          RATE {presentingGroup.group_name}
        </h1>
        {presentingGroup.product && (
          <div className="text-xs text-sky-300 font-semibold mt-1">
            {presentingGroup.product.name} ({presentingGroup.product.company})
          </div>
        )}
      </div>

      {/* Main Scoring / Waiting Area */}
      <div className="my-auto space-y-4 py-4">
        {!isCaptain ? (
          /* Non-Captain Student View during scoring */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-3xl bg-slate-900/90 border border-amber-400/30 shadow-2xl text-center space-y-5"
          >
            <div className="relative w-16 h-16 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400">
              <span className="w-6 h-6 rounded-full bg-amber-400/40 animate-ping absolute"></span>
              <Clock className="w-8 h-8 text-amber-400 relative z-10" />
            </div>
            <div>
              <h2 className="font-display font-black text-2xl text-white tracking-wide uppercase">
                {presentingGroup.group_name} IS BEING SCORED
              </h2>
              <p className="text-xs font-mono text-amber-300 mt-2">
                "Captains are submitting their marks."
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-[11px] text-slate-400 font-mono">
              Only team captains receive the peer evaluation panel. Please stand by while scores are recorded.
            </div>
          </motion.div>
        ) : isMyGroup ? (
          /* Presenting Team Captain View */
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-sky-500/25 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto border border-sky-400/30">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="font-display font-black text-xl text-white">YOUR TEAM IS ON STAGE!</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You cannot rate your own team. Deliver your presentation while captains of other teams score your pitch.
            </p>
          </div>
        ) : submitted ? (
          /* Submitted Locked State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-2xl text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-display font-black text-2xl text-white">✓ MARK SUBMITTED</h3>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              "Your mark has been recorded."
            </p>
            <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-white/10">
              The captain cannot submit another mark for the same presentation. Scores remain hidden until final reveal.
            </div>
          </motion.div>
        ) : (
          /* Eligible Captain Active Form */
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-amber-400/30 shadow-2xl backdrop-blur-xl space-y-6"
          >
            <div className="text-center">
              <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>👑 CAPTAIN EVALUATION</span>
              </div>
              <label className="text-sm font-display font-bold text-slate-200 block">
                How many marks would you give this presentation?
              </label>

              {/* Selected Score Indicator */}
              <div className="my-4">
                <div className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">
                  YOUR SCORE
                </div>
                <div className="font-mono font-black text-6xl text-amber-400">
                  {selectedScore !== null ? selectedScore : '--'}
                  <span className="text-base text-slate-500 font-normal"> / 10</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mt-1">
                  Maximum: 10 MARKS
                </div>
              </div>
            </div>

            {/* Score 0 to 10 Buttons Grid */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider text-center mb-2">
                Select a score:
              </div>
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setSelectedScore(val)}
                    className={`py-3 rounded-xl font-mono font-black text-lg transition ${
                      selectedScore === val
                        ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30 scale-105'
                        : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2 pt-1">
                {[6, 7, 8, 9, 10].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setSelectedScore(val)}
                    className={`py-3 rounded-xl font-mono font-black text-lg transition ${
                      selectedScore === val
                        ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30 scale-105'
                        : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={selectedScore === null}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-display font-black text-base tracking-wider uppercase shadow-xl shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.98] transition disabled:opacity-50"
            >
              [ SUBMIT MARK ]
            </button>
          </form>
        )}
      </div>

      <div className="text-center text-[11px] text-slate-600 font-mono pb-2">
        BMC LIVE Classroom
      </div>
    </div>
  );
};
