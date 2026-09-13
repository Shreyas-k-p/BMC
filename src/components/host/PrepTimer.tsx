import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, Maximize, Minimize, AlertTriangle, ArrowRight } from 'lucide-react';
import { playUrgentTick, playTimeUpBuzzer } from '../../lib/audio';

interface PrepTimerProps {
  stage: 'PREPARATION' | 'STUDY_TIME';
  startedAt: string | null | undefined;
  duration: number; // in seconds: 900 for 15m prep, 600 for 10m study
  onStart: () => void;
  onPause: (remaining: number) => void;
  onReset: () => void;
  onProceedToNext: () => void;
}

export const PrepTimer: React.FC<PrepTimerProps> = ({
  stage,
  startedAt,
  duration,
  onStart,
  onPause,
  onReset,
  onProceedToNext,
}) => {
  const [remainingSecs, setRemainingSecs] = useState<number>(duration);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [countdownText, setCountdownText] = useState<string | null>(null);

  const prevSecRef = useRef<number>(duration);
  const isRunning = Boolean(startedAt);

  const isStudyStage = stage === 'STUDY_TIME';

  // Synchronized timer calculation from startedAt timestamp
  useEffect(() => {
    if (!startedAt) {
      setRemainingSecs(duration);
      return;
    }

    const interval = setInterval(() => {
      const startMs = new Date(startedAt).getTime();
      const nowMs = Date.now();
      const elapsedSecs = Math.floor((nowMs - startMs) / 1000);
      const remaining = Math.max(0, duration - elapsedSecs);

      setRemainingSecs(remaining);

      // Warning at 01:00 (60s)
      if (remaining === 60 && prevSecRef.current !== 60) playUrgentTick();
      // 10, 9, 8... countdown
      if (remaining <= 10 && remaining > 0 && prevSecRef.current !== remaining) playUrgentTick();
      // 00:00 TIME'S UP! / STUDY TIME OVER
      if (remaining === 0 && prevSecRef.current !== 0) {
        playTimeUpBuzzer();
        // Auto transition after 3s
        setTimeout(() => {
          onProceedToNext();
        }, 3000);
      }

      prevSecRef.current = remaining;
    }, 250);

    return () => clearInterval(interval);
  }, [startedAt, duration, onProceedToNext]);

  // "3, 2, 1, GO!" intro animation
  const handleStartWithIntro = () => {
    setCountdownText('3');
    playUrgentTick();

    setTimeout(() => {
      setCountdownText('2');
      playUrgentTick();
    }, 1000);

    setTimeout(() => {
      setCountdownText('1');
      playUrgentTick();
    }, 2000);

    setTimeout(() => {
      setCountdownText('GO!');
      playUrgentTick();
    }, 3000);

    setTimeout(() => {
      setCountdownText(null);
      onStart();
    }, 3800);
  };

  const handlePause = () => {
    onPause(remainingSecs);
  };

  const handleConfirmCancel = () => {
    onReset();
    setShowCancelConfirm(false);
    setIsFullscreen(false);
  };

  const minutes = Math.floor(remainingSecs / 60);
  const seconds = remainingSecs % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isWarning = remainingSecs <= 60 && remainingSecs > 10;
  const isFinalTen = remainingSecs <= 10 && remainingSecs > 0;
  const isTimeUp = remainingSecs === 0;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* 3, 2, 1, GO! Countdown Overlay */}
      {countdownText !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center">
          <div className="text-8xl sm:text-9xl md:text-[14rem] font-display font-black text-sky-400 animate-bounce">
            {countdownText}
          </div>
        </div>
      )}

      {/* Stage Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isStudyStage ? 'bg-amber-400' : 'bg-cyan-400'}`}></span>
            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isStudyStage ? 'text-amber-400' : 'text-cyan-400'}`}>
              {isStudyStage ? 'STAGE 05 • 10-MINUTE PRODUCT STUDY' : 'STAGE 04 • 15-MINUTE BMC PREPARATION'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-white mt-1">
            {isStudyStage ? 'STUDY TIME' : 'BMC PREPARATION'}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {isStudyStage
              ? 'Use this time to study your product and prepare your final explanation.'
              : 'Teams create their Business Model Canvas and prepare their presentation.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFullscreen(true)}
            className="py-3 px-5 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-display font-bold flex items-center gap-2 transition hover:bg-sky-500/25"
          >
            <Maximize className="w-4 h-4" />
            <span>FULL SCREEN</span>
          </button>

          <button
            onClick={onProceedToNext}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 font-display font-black text-xs tracking-wider uppercase flex items-center gap-2 transition shadow-lg shadow-sky-500/25 hover:scale-[1.02]"
          >
            <span>{isStudyStage ? 'PRESENTATION ORDER' : 'NEXT STAGE (STUDY TIME)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Clock Display Card */}
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900/85 border border-sky-500/25 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="text-xs font-mono font-bold tracking-widest uppercase text-sky-400 mb-2">
          {isRunning ? '● SYNCHRONIZED ACROSS ALL STUDENT PHONES' : 'TIMER READY / PAUSED'}
        </div>

        {/* Display Timer */}
        <div className="my-6 text-center">
          {isTimeUp ? (
            <div className="text-6xl sm:text-8xl font-display font-black text-rose-500 animate-pulse">
              {isStudyStage ? 'STUDY TIME OVER' : "TIME'S UP!"}
            </div>
          ) : isFinalTen ? (
            <div className="text-8xl sm:text-9xl font-mono font-black text-rose-400 animate-pulse">
              {remainingSecs}
            </div>
          ) : (
            <div
              className={`font-mono font-black text-7xl sm:text-9xl tracking-tight transition-colors ${
                isWarning ? 'text-amber-300 animate-pulse' : 'text-white'
              }`}
            >
              {timeString}
            </div>
          )}

          {isWarning && !isFinalTen && (
            <div className="text-sm font-mono font-bold text-amber-400 mt-2 uppercase tracking-wider">
              ⚠️ 1 MINUTE REMAINING
            </div>
          )}
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center gap-4 mt-6">
          {!isRunning ? (
            <button
              onClick={handleStartWithIntro}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 font-display font-black text-base tracking-wider uppercase shadow-xl shadow-sky-500/30 flex items-center gap-2 hover:scale-[1.02] transition"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>{isStudyStage ? 'START' : 'START 15 MIN TIMER'}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-8 py-4 rounded-2xl bg-amber-500 text-slate-950 font-display font-black text-base tracking-wider uppercase shadow-xl shadow-amber-500/30 flex items-center gap-2 hover:scale-[1.02] transition"
            >
              <Pause className="w-5 h-5 fill-slate-950" />
              <span>PAUSE</span>
            </button>
          )}

          <button
            onClick={() => setShowCancelConfirm(true)}
            className="px-5 py-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition text-xs font-bold font-mono tracking-wider"
          >
            CANCEL
          </button>

          <button
            onClick={() => setIsFullscreen(true)}
            className="px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-bold font-mono"
          >
            <Maximize className="w-4 h-4" />
            <span>FULL SCREEN</span>
          </button>
        </div>
      </div>

      {/* Classroom Full Screen Timer */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-8 sm:p-14 select-none animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div>
              <div className="font-display font-black text-3xl tracking-widest text-white">
                BMC LIVE
              </div>
              <div className="font-mono text-sm font-bold text-sky-400 uppercase tracking-widest mt-1">
                {isStudyStage ? 'STUDY TIME' : 'BMC PREPARATION'}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 text-xs font-mono font-bold transition"
              >
                CANCEL
              </button>

              <button
                onClick={() => setIsFullscreen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono font-bold transition flex items-center gap-2"
              >
                <Minimize className="w-4 h-4" />
                <span>EXIT FULL SCREEN</span>
              </button>
            </div>
          </div>

          {/* Center Giant Numbers */}
          <div className="flex flex-col items-center justify-center my-auto text-center">
            {isTimeUp ? (
              <div className="font-display font-black text-8xl sm:text-9xl md:text-[14rem] text-rose-500 animate-pulse leading-none">
                {isStudyStage ? 'STUDY TIME OVER' : "TIME'S UP!"}
              </div>
            ) : isFinalTen ? (
              <div className="font-mono font-black text-9xl sm:text-[14rem] md:text-[18rem] text-rose-400 animate-pulse leading-none">
                {remainingSecs}
              </div>
            ) : (
              <div
                className={`font-mono font-black text-8xl sm:text-9xl md:text-[16rem] tracking-tight leading-none ${
                  isWarning ? 'text-amber-300 animate-pulse' : 'text-white'
                }`}
              >
                {timeString}
              </div>
            )}

            {isWarning && !isFinalTen && (
              <div className="text-2xl font-mono font-bold text-amber-400 mt-6 tracking-wider uppercase">
                ⚠️ 1 MINUTE REMAINING
              </div>
            )}
          </div>

          {/* Bottom Bar Controls */}
          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <div className="text-xs font-mono text-slate-500">
              Synchronized Classroom Clock
            </div>
            <div>
              {!isRunning ? (
                <button
                  onClick={handleStartWithIntro}
                  className="px-8 py-3 rounded-xl bg-sky-400 text-slate-950 font-display font-black text-sm tracking-wider uppercase"
                >
                  START
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="px-8 py-3 rounded-xl bg-amber-400 text-slate-950 font-display font-black text-sm tracking-wider uppercase"
                >
                  PAUSE
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
            <h3 className="font-display font-black text-lg text-white">
              Cancel {isStudyStage ? 'Study' : 'Preparation'} Timer?
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Are you sure you want to cancel the timer?
            </p>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold"
              >
                Keep Running
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/30"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
