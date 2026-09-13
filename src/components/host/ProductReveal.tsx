import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, RefreshCw, Briefcase } from 'lucide-react';
import { Group } from '../../types';
import { playTeamRevealed } from '../../lib/audio';

interface ProductRevealProps {
  groups: Group[];
  onAssignProducts: () => void;
  onProceedToPrep: () => void;
}

export const ProductReveal: React.FC<ProductRevealProps> = ({
  groups,
  onAssignProducts,
  onProceedToPrep,
}) => {
  const [revealing, setRevealing] = useState(false);

  const hasProductsAssigned = groups.some((g) => g.product !== null && g.product !== undefined);

  const handleAssignClick = () => {
    setRevealing(true);
    onAssignProducts();
    playTeamRevealed();
    setTimeout(() => {
      setRevealing(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              STAGE 03 • BUSINESS CHALLENGE
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-white mt-1">
            BUSINESS CHALLENGE
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Randomized real-world market products assigned to each team.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAssignClick}
            className="py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-display font-bold flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-4 h-4 ${revealing ? 'animate-spin' : ''}`} />
            <span>ASSIGN PRODUCTS</span>
          </button>

          <button
            onClick={onProceedToPrep}
            disabled={!hasProductsAssigned}
            className={`py-3 px-6 rounded-xl font-display font-black text-xs tracking-wider uppercase flex items-center gap-2 transition shadow-lg ${
              hasProductsAssigned
                ? 'bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <span>START 15-MINUTE PREPARATION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of Team Product Cards — Strictly PRODUCT NAME + COMPANY NAME */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group, idx) => {
          const product = group.product;
          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-slate-900/85 border border-sky-500/25 hover:border-sky-400/50 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between"
            >
              <div>
                {/* Team Number */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <h3 className="font-display font-black text-2xl text-white">
                    {group.group_name}
                  </h3>
                  <span className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">
                    {group.members.length} members
                  </span>
                </div>

                {/* Strictly Product and Company Only */}
                <AnimatePresence mode="wait">
                  {product ? (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 py-3"
                    >
                      <div>
                        <div className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">
                          PRODUCT:
                        </div>
                        <h4 className="font-display font-black text-3xl text-white tracking-tight">
                          {product.name}
                        </h4>
                      </div>

                      <div className="pt-3 border-t border-white/10">
                        <div className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">
                          COMPANY:
                        </div>
                        <div className="font-display font-black text-xl text-sky-400">
                          {product.company}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center">
                      <Briefcase className="w-8 h-8 text-slate-600 mb-2 opacity-40" />
                      <p className="font-display font-bold text-slate-400">Click "ASSIGN PRODUCTS" above</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Team Members */}
              <div className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-400 font-medium truncate">
                {group.members.map((m) => m.name.split(' ')[0]).join(', ')}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
