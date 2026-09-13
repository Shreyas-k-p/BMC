import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Sparkles, ArrowRight, UserPlus, Trash2, ShieldCheck, AlertTriangle, X } from 'lucide-react';
import { Participant, Department, LobbyMessage } from '../../types';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { calculateGroupingRecommendation } from '../../lib/grouping';
import { LobbyFloatingMessages } from '../common/LobbyFloatingMessages';

interface HostQRJoinProps {
  joinCode: string;
  joinUrl: string;
  participants: Participant[];
  lobbyMessages?: LobbyMessage[];
  onAddParticipant: (name: string, dept: Department) => void;
  onAddDemoStudents: (count: number) => void;
  onRemoveParticipant: (id: string) => void;
  onProceedToGrouping: () => void;
  onClearAll: () => void;
}

const DEPARTMENTS: Department[] = ['AI', 'CSE', 'CY', 'ME', 'CE', 'ECE', 'EEE', 'IC'];

export const HostQRJoin: React.FC<HostQRJoinProps> = ({
  joinCode,
  joinUrl,
  participants,
  lobbyMessages = [],
  onAddParticipant,
  onAddDemoStudents,
  onRemoveParticipant,
  onProceedToGrouping,
  onClearAll,
}) => {
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [demoCount, setDemoCount] = useState<number>(30);

  const recommendation = calculateGroupingRecommendation(participants.length);

  const filteredParticipants = participants.filter((p) => {
    const matchesDept = filterDept === 'ALL' || p.department === filterDept;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleGenerateDemo = () => {
    onAddDemoStudents(demoCount);
    setShowDemoModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 select-none relative overflow-hidden">
      {/* Live Classroom Floating Bubbles Layer */}
      <LobbyFloatingMessages messages={lobbyMessages} maxVisible={8} />

      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-black uppercase tracking-widest text-emerald-400">
              LIVE CLASSROOM STAGE
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-display font-black text-white mt-1">
            BMC LIVE
          </h1>
          <p className="text-lg font-display font-extrabold text-sky-400 tracking-wider mt-1">
            BUILD. COMPETE. PITCH. WIN.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowDemoModal(true)}
            className="py-3 px-5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-300 text-xs font-display font-black tracking-wider uppercase flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>[ ADD DEMO STUDENTS ]</span>
          </button>

          <button
            onClick={onProceedToGrouping}
            disabled={!recommendation.possible}
            className={`py-3.5 px-8 rounded-2xl font-display font-black text-sm tracking-wider uppercase flex items-center gap-2 transition shadow-xl ${
              recommendation.possible
                ? 'bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 shadow-sky-500/30 hover:scale-[1.03] active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <span>[ MAKE GROUPS ]</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Grid: QR Left + Live Feed Center/Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: QR Code & Session Info */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <QRCodeDisplay url={joinUrl} joinCode={joinCode} size={270} />

          {/* Grouping Feasibility Check */}
          <div className="w-full max-w-sm mt-5 p-4 rounded-2xl bg-slate-900/80 border border-white/10 text-xs">
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-400 uppercase tracking-wider">Group Rule Check</span>
              {recommendation.possible ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Valid
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Min 5 Needed
                </span>
              )}
            </div>

            <div className="mt-2 text-slate-300">
              {recommendation.possible ? (
                <div>
                  <span className="font-bold text-white">{participants.length} Students</span> will form{' '}
                  <span className="font-bold text-sky-400">{recommendation.groupCount} Teams</span> of sizes{' '}
                  <span className="font-mono text-slate-200">[{recommendation.groupSizes.join(', ')}]</span>.
                </div>
              ) : (
                <div className="text-slate-400">
                  {recommendation.reason || 'At least 5 participants required to form equal 5–7 member teams.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: LIVE PARTICIPANTS Wall */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-900/80 border border-sky-500/25 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
            {/* Header / Participant Count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
              <div>
                <h2 className="text-2xl font-display font-black text-white">
                  LIVE PARTICIPANTS
                </h2>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-display font-black text-sky-400">
                    {participants.length}
                  </span>
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    STUDENTS
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="bg-slate-950 border border-white/15 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-400 font-medium"
                >
                  <option value="ALL">All Departments</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-white/15 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-400 w-36"
                />

                {participants.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition"
                    title="Clear list"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Participants Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence>
                {filteredParticipants.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-slate-500 text-xs">
                    <UserPlus className="w-12 h-12 mx-auto stroke-1 mb-3 opacity-30 text-sky-400" />
                    <p className="font-display font-bold text-base text-slate-300">
                      Waiting for students to join...
                    </p>
                    <p className="text-slate-500 mt-1">
                      Scan the QR code or click "[ ADD DEMO STUDENTS ]" for testing.
                    </p>
                  </div>
                ) : (
                  filteredParticipants.map((p) => {
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.85, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.25 }}
                        className="group p-3 rounded-2xl bg-white/[0.04] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 transition-all flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-display font-bold text-sm text-white truncate group-hover:text-sky-300">
                            {p.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-mono text-sky-400 font-bold uppercase">
                              {p.department}
                            </span>
                            {p.is_demo && (
                              <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                DEMO
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Online
                          </span>
                          <button
                            onClick={() => onRemoveParticipant(p.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 transition"
                            title="Remove student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Add Demo Students Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-400/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-black text-xl text-white">ADD DEMO STUDENTS</h3>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Generate realistic demo participants for classroom testing and full session demonstration.
            </p>

            <div>
              <label className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider block mb-2">
                Number of Demo Students:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={demoCount}
                  onChange={(e) => setDemoCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 px-3 py-2 bg-slate-950 border border-amber-400/40 rounded-xl text-white font-mono font-bold text-lg text-center focus:outline-none focus:border-amber-400"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {[12, 18, 30, 42].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setDemoCount(cnt)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                        demoCount === cnt
                          ? 'bg-amber-400 text-slate-950 border-amber-400'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateDemo}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition"
              >
                [ GENERATE DEMO STUDENTS ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
