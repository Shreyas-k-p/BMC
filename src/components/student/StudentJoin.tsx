import React, { useState } from 'react';
import { ArrowRight, User, GraduationCap } from 'lucide-react';
import { Department } from '../../types';

interface StudentJoinProps {
  joinCode: string;
  onJoin: (name: string, dept: Department) => void;
}

// Exactly the 8 departments specified in requirement 5
const DEPARTMENTS: Department[] = ['AI', 'CSE', 'CY', 'ME', 'CE', 'ECE', 'EEE', 'IC'];

export const StudentJoin: React.FC<StudentJoinProps> = ({ joinCode, onJoin }) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState<Department>('AI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    onJoin(name.trim(), department);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-5 text-white">
      {/* Top Header */}
      <div className="text-center pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-400 font-mono text-xs font-bold uppercase tracking-wider mb-3">
          <span>SESSION: {joinCode}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white">
          JOIN BMC LIVE
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Business Model Canvas Classroom Competition
        </p>
      </div>

      {/* Main Join Form */}
      <form onSubmit={handleSubmit} className="my-auto space-y-4 max-w-sm w-full mx-auto">
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-sky-500/25 shadow-2xl backdrop-blur-xl space-y-5">
          <div>
            <label className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <User className="w-3.5 h-3.5" /> Name
            </label>
            <input
              type="text"
              required
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-white/15 text-white font-display text-base font-semibold focus:outline-none focus:border-sky-400 transition placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <GraduationCap className="w-3.5 h-3.5" /> Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-white/15 text-white font-display text-base font-semibold focus:outline-none focus:border-sky-400 transition"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 font-display font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl shadow-sky-500/25 hover:scale-[1.01] active:scale-[0.98] transition disabled:opacity-40"
          >
            <span>JOIN SESSION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="text-center pb-4 text-[11px] text-slate-600 font-mono">
        BMC LIVE • Student Mobile Screen
      </div>
    </div>
  );
};
