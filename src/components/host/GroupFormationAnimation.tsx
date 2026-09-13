import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shuffle, CheckCircle2 } from 'lucide-react';
import { Participant } from '../../types';
import { playShuffleTick, playTeamRevealed } from '../../lib/audio';

interface GroupFormationAnimationProps {
  participants: Participant[];
  expectedGroupCount: number;
  onAnimationComplete: () => void;
}

export const GroupFormationAnimation: React.FC<GroupFormationAnimationProps> = ({
  participants,
  expectedGroupCount,
  onAnimationComplete,
}) => {
  const [phase, setPhase] = useState<'CREATING' | 'BALANCING' | 'READY'>('CREATING');
  const [activeNames, setActiveNames] = useState<string[]>([]);
  const [revealedTeams, setRevealedTeams] = useState<number[]>([]);

  useEffect(() => {
    // Sound & name shuffle intervals
    const soundInterval = setInterval(() => {
      playShuffleTick();
    }, 140);

    const nameInterval = setInterval(() => {
      const sampled = [...participants]
        .sort(() => Math.random() - 0.5)
        .slice(0, 6)
        .map((p) => `${p.name} (${p.department})`);
      setActiveNames(sampled);
    }, 180);

    // Phase 1 -> 2: BALANCING TEAMS...
    const timerPhase2 = setTimeout(() => {
      setPhase('BALANCING');
    }, 2200);

    // Phase 2 -> 3: TEAMS READY
    const timerPhase3 = setTimeout(() => {
      clearInterval(soundInterval);
      clearInterval(nameInterval);
      setPhase('READY');
      playTeamRevealed();

      // Reveal teams one by one
      for (let i = 1; i <= expectedGroupCount; i++) {
        setTimeout(() => {
          setRevealedTeams((prev) => [...prev, i]);
          playShuffleTick();
        }, i * 350);
      }
    }, 4200);

    // Complete after all teams revealed
    const totalDuration = 4200 + (expectedGroupCount * 350) + 1200;
    const timerComplete = setTimeout(() => {
      onAnimationComplete();
    }, totalDuration);

    return () => {
      clearInterval(soundInterval);
      clearInterval(nameInterval);
      clearTimeout(timerPhase2);
      clearTimeout(timerPhase3);
      clearTimeout(timerComplete);
    };
  }, [participants, expectedGroupCount, onAnimationComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute w-[600px] h-[600px] bg-sky-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>

      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center">
        {/* Animated Icon Badge */}
        <motion.div
          animate={{
            rotate: phase === 'READY' ? 0 : 360,
            scale: phase === 'READY' ? [1, 1.15, 1] : 1,
          }}
          transition={{
            rotate: { repeat: Infinity, duration: 2, ease: 'linear' },
            scale: { duration: 0.4 },
          }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-500 to-cyan-400 p-0.5 shadow-2xl shadow-sky-500/50 mb-6 flex items-center justify-center"
        >
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-sky-400">
            {phase === 'READY' ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            ) : phase === 'BALANCING' ? (
              <Users className="w-10 h-10 text-amber-400 animate-pulse" />
            ) : (
              <Shuffle className="w-10 h-10 text-sky-400" />
            )}
          </div>
        </motion.div>

        {/* Phase Text with Framer Motion AnimatePresence */}
        <AnimatePresence mode="wait">
          {phase === 'CREATING' && (
            <motion.div
              key="creating"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-2"
            >
              <h2 className="text-4xl sm:text-5xl font-display font-black text-white">
                CREATING TEAMS...
              </h2>
              <p className="text-sm text-slate-400">
                Randomizing across {participants.length} engineering students...
              </p>
            </motion.div>
          )}

          {phase === 'BALANCING' && (
            <motion.div
              key="balancing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-2"
            >
              <h2 className="text-4xl sm:text-5xl font-display font-black text-amber-300">
                BALANCING TEAMS...
              </h2>
              <p className="text-sm text-slate-400">
                Interleaving departments and balancing team sizes to 5–7 members...
              </p>
            </motion.div>
          )}

          {phase === 'READY' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <h2 className="text-4xl sm:text-5xl font-display font-black text-emerald-400">
                TEAMS READY
              </h2>
              <p className="text-sm text-slate-400">
                Formed {expectedGroupCount} balanced teams
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Shuffle Cloud in phase 1 & 2 */}
        {phase !== 'READY' ? (
          <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-md">
            {activeNames.map((name, i) => (
              <motion.div
                key={i + name}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-display font-bold text-slate-200 truncate"
              >
                {name}
              </motion.div>
            ))}
          </div>
        ) : (
          /* Reveal teams one by one in phase 3 */
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 w-full max-w-lg">
            {revealedTeams.map((teamNum) => (
              <motion.div
                key={teamNum}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="py-3 px-5 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-white font-display font-black text-base shadow-xl"
              >
                TEAM {teamNum}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
