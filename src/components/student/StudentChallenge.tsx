import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Group } from '../../types';

interface StudentChallengeProps {
  group: Group;
  stage?: 'PREPARATION' | 'STUDY_TIME';
  startedAt: string | null | undefined;
  duration: number;
}

export const StudentChallenge: React.FC<StudentChallengeProps> = ({
  group,
  stage = 'PREPARATION',
  startedAt,
  duration,
}) => {
  const [remainingSecs, setRemainingSecs] = useState<number>(duration);

  const isStudyStage = stage === 'STUDY_TIME';

  // Synchronized prep/study timer from host startedAt timestamp
  useEffect(() => {
    if (!startedAt) {
      setRemainingSecs(duration);
      return;
    }

    const interval = setInterval(() => {
      const startMs = new Date(startedAt).getTime();
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      setRemainingSecs(Math.max(0, duration - elapsed));
    }, 250);

    return () => clearInterval(interval);
  }, [startedAt, duration]);

  const minutes = Math.floor(remainingSecs / 60);
  const seconds = remainingSecs % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const product = group.product;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-6 text-white max-w-md mx-auto animate-fadeIn">
      {/* Top Bar with Team Number and Synchronized Timer */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 pt-2">
        <div>
          <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2.5 py-1 rounded border border-sky-400/25">
            {group.group_name}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-sky-500/30 text-xs font-mono font-bold">
          <Clock className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span className={remainingSecs <= 60 ? 'text-rose-400 font-bold' : 'text-sky-300'}>
            {remainingSecs === 0
              ? isStudyStage ? 'STUDY TIME OVER' : "TIME'S UP!"
              : timeString}
          </span>
        </div>
      </div>

      {/* Stage Header */}
      <div className="text-center mt-4">
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
          {isStudyStage ? 'STAGE 2 • STUDY TIME' : 'STAGE 1 • BMC PREPARATION'}
        </h2>
        <h1 className="text-3xl font-display font-black text-white mt-1">
          {isStudyStage ? 'STUDY TIME' : 'BMC PREPARATION'}
        </h1>
      </div>

      {/* Product Case Study Card (PRODUCT NAME + COMPANY ONLY) */}
      <div className="my-auto py-4">
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-sky-500/25 shadow-2xl backdrop-blur-xl text-center space-y-6">
          <div className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            ASSIGNED CASE STUDY
          </div>

          {product ? (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  PRODUCT:
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight uppercase">
                  {product.name}
                </h1>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  COMPANY:
                </div>
                <div className="text-2xl font-display font-bold text-sky-400">
                  {product.company}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-slate-500 text-sm">
              Waiting for product assignment...
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-xs text-slate-300 leading-relaxed font-body">
          {isStudyStage
            ? 'Use this time to study your product and prepare your final explanation.'
            : 'Teams create their Business Model Canvas and prepare their presentation.'}
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-600 font-mono pb-2">
        BMC LIVE Classroom
      </div>
    </div>
  );
};
