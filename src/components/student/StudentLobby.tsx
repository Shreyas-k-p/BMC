import React, { useState } from 'react';
import { CheckCircle2, Clock, Send, MessageSquare } from 'lucide-react';
import { Participant, LobbyMessage, SessionState } from '../../types';
import { LobbyFloatingMessages } from '../common/LobbyFloatingMessages';

interface StudentLobbyProps {
  participant: Participant;
  joinCode: string;
  sessionStatus: SessionState;
  messages: LobbyMessage[];
  onSendMessage: (participantId: string, participantName: string, text: string) => void;
}

export const StudentLobby: React.FC<StudentLobbyProps> = ({
  participant,
  joinCode,
  sessionStatus,
  messages,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');

  // Messaging is enabled strictly during LOBBY and JOINING stage before host clicks MAKE GROUPS
  const isMessagingAllowed = sessionStatus === 'LOBBY' || sessionStatus === 'JOINING';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isMessagingAllowed) return;

    onSendMessage(participant.id, participant.name, inputText.trim());
    setInputText('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-5 text-white max-w-md mx-auto relative overflow-hidden select-none">
      {/* Live Floating Message Bubbles Layer (Only active in LOBBY/JOINING) */}
      {isMessagingAllowed && <LobbyFloatingMessages messages={messages} maxVisible={6} />}

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">CONNECTED</span>
        </div>
        <span className="text-xs font-mono text-slate-400">SESSION: {joinCode}</span>
      </div>

      {/* Main Status Display */}
      <div className="my-auto space-y-6 text-center relative z-10 py-6">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <h1 className="text-4xl font-display font-black text-white tracking-tight">
            YOU'RE IN!
          </h1>
          <h2 className="text-2xl font-display font-bold text-sky-400 mt-2">
            {participant.name}
          </h2>
          <div className="mt-2">
            <span className="inline-block text-xs font-mono font-bold uppercase px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-400/25">
              DEPARTMENT: {participant.department}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 text-center space-y-2 backdrop-blur-xl">
          <Clock className="w-5 h-5 text-sky-400 mx-auto animate-pulse" />
          <p className="font-display font-semibold text-sm text-slate-300">
            Waiting for the host...
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            The host will create teams shortly. Your assigned team and case study will appear right here automatically.
          </p>
        </div>
      </div>

      {/* Bottom Message Input Bar (Strictly ONLY rendered in LOBBY / JOINING stage) */}
      {isMessagingAllowed ? (
        <form onSubmit={handleSend} className="relative z-20 pb-2">
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 border border-sky-400/30 shadow-2xl backdrop-blur-xl">
            <input
              type="text"
              maxLength={120}
              placeholder="Send a live message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3 py-2 bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500 font-medium"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="py-2 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow"
            >
              <span>SEND</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center text-[11px] text-slate-600 font-mono pb-2">
          BMC LIVE Classroom
        </div>
      )}
    </div>
  );
};
