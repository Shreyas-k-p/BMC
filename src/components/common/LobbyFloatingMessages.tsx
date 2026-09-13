import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { LobbyMessage } from '../../types';

interface LobbyFloatingMessagesProps {
  messages: LobbyMessage[];
  maxVisible?: number;
}

interface ActiveBubble extends LobbyMessage {
  leftPercent: number; // Random horizontal offset 10% - 80%
  animationDuration: number;
}

export const LobbyFloatingMessages: React.FC<LobbyFloatingMessagesProps> = ({
  messages = [],
  maxVisible = 6,
}) => {
  const [activeBubbles, setActiveBubbles] = useState<ActiveBubble[]>([]);

  // When new messages arrive, add them to activeBubbles and schedule auto-removal
  useEffect(() => {
    if (!messages || messages.length === 0) {
      setActiveBubbles([]);
      return;
    }

    // Take recent messages
    const recent = messages.slice(-maxVisible);

    setActiveBubbles((prev) => {
      const existingIds = new Set(prev.map((b) => b.id));
      const newItems: ActiveBubble[] = [];

      recent.forEach((msg) => {
        if (!existingIds.has(msg.id)) {
          // Pre-calculate deterministic horizontal position based on message ID hash
          let hash = 0;
          for (let i = 0; i < msg.id.length; i++) {
            hash = (hash << 5) - hash + msg.id.charCodeAt(i);
            hash |= 0;
          }
          const posX = 12 + Math.abs(hash % 72); // 12% to 84% width

          newItems.push({
            ...msg,
            leftPercent: posX,
            animationDuration: 4.5 + Math.abs(hash % 10) * 0.1, // 4.5s to 5.5s duration
          });
        }
      });

      // Combine and cap at maxVisible
      const combined = [...prev, ...newItems];
      return combined.slice(-maxVisible);
    });
  }, [messages, maxVisible]);

  // Clean up old bubbles after their float animation finishes
  const handleAnimationComplete = (id: string) => {
    setActiveBubbles((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 top-20 z-40 overflow-hidden max-w-7xl mx-auto">
      <AnimatePresence>
        {activeBubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            initial={{ opacity: 0, scale: 0.7, y: 120 }}
            animate={{
              opacity: [0, 0.95, 0.95, 0],
              scale: [0.7, 1, 1, 0.92],
              y: [120, -140, -320],
            }}
            transition={{
              duration: bubble.animationDuration,
              ease: [0.22, 1, 0.36, 1],
              times: [0, 0.15, 0.75, 1],
            }}
            onAnimationComplete={() => handleAnimationComplete(bubble.id)}
            style={{ left: `${bubble.leftPercent}%` }}
            className="absolute bottom-4 -translate-x-1/2 max-w-xs sm:max-w-sm px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-sky-400/35 text-white shadow-2xl backdrop-blur-xl flex items-start gap-2.5 pointer-events-none"
          >
            <div className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageSquare className="w-3 h-3" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-mono font-bold text-sky-300 truncate">
                {bubble.participant_name}
              </div>
              <div className="text-xs font-display font-medium text-slate-100 break-words leading-snug">
                {bubble.message}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
