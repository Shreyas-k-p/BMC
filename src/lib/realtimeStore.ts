import { useState, useEffect } from 'react';
import { Session, Participant, Group, PeerScore, SessionState, Department, LobbyMessage } from '../types';
import { getRandomizedProducts } from './products';
import { generateBalancedGroups } from './grouping';
import { generateDemoParticipants } from './mockData';
import { supabase, isSupabaseConfigured } from './supabase';

const LOCAL_STORAGE_KEY = 'bmc_live_session_store_v2';
const BROADCAST_CHANNEL_NAME = 'bmc_live_realtime_channel_v2';

interface StoreData {
  session: Session;
  participants: Participant[];
  groups: Group[];
  peerScores: PeerScore[];
  lobbyMessages: LobbyMessage[];
}

function getDefaultStore(joinCode = 'BMC2026'): StoreData {
  return {
    session: {
      id: 'sess_' + Date.now(),
      join_code: joinCode,
      status: 'LOBBY',
      host_key: 'host_key_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      preparation_duration: 15 * 60, // 15 min BMC prep
      study_duration: 10 * 60, // 10 min product study
      presentation_duration: 3 * 60, // 3 min pitch
      scoring_open: false
    },
    participants: [],
    groups: [],
    peerScores: [],
    lobbyMessages: []
  };
}

class RealtimeSessionManager {
  private data: StoreData;
  private listeners: Set<(data: StoreData) => void> = new Set();
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.data = this.loadFromStorage() || getDefaultStore();

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC_STATE') {
          this.data = event.data.payload;
          this.notifyListeners();
        }
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
          try {
            this.data = JSON.parse(e.newValue);
            this.notifyListeners();
          } catch(err) {}
        }
      });
    }

    if (isSupabaseConfigured && supabase) {
      this.initSupabaseSubscriptions();
    }
  }

  private initSupabaseSubscriptions() {
    if (!supabase) return;
    try {
      supabase
        .channel('public:sessions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
          this.pullFromSupabase();
        })
        .subscribe();
    } catch(e) {}
  }

  private async pullFromSupabase() {
    if (!supabase) return;
    try {
      const { data: session } = await supabase.from('sessions').select('*').order('created_at', { ascending: false }).limit(1).single();
      if (session) {
        this.data.session.status = session.status as SessionState;
        this.notifyListeners();
      }
    } catch(e) {}
  }

  private loadFromStorage(): StoreData | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return null;
  }

  private saveAndBroadcast() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.data));
      } catch(e) {}
    }

    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'SYNC_STATE',
          payload: this.data
        });
      } catch(e) {}
    }

    this.notifyListeners();
  }

  public subscribe(listener: (data: StoreData) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener({ ...this.data }));
  }

  public getData(): StoreData {
    return { ...this.data };
  }

  // --- ACTIONS ---

  public createNewSession(joinCode?: string) {
    const code = joinCode?.toUpperCase() || 'BMC' + Math.floor(100 + Math.random() * 900);
    this.data = getDefaultStore(code);
    this.saveAndBroadcast();
  }

  public setSessionState(status: SessionState) {
    this.data.session.status = status;
    // When session state transitions away from LOBBY / JOINING (e.g. host clicks MAKE GROUPS -> GROUPING),
    // immediately clear all visible floating messages and reject future message inserts!
    if (status !== 'LOBBY' && status !== 'JOINING') {
      this.data.lobbyMessages = [];
    }
    this.saveAndBroadcast();
  }

  public sendLobbyMessage(participantId: string, participantName: string, text: string) {
    // STRICT RULE: Students can send messages ONLY while session state is LOBBY or JOINING
    if (this.data.session.status !== 'LOBBY' && this.data.session.status !== 'JOINING') {
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    const msg: LobbyMessage = {
      id: 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      session_id: this.data.session.id,
      participant_id: participantId,
      participant_name: participantName.trim(),
      message: trimmed.substring(0, 120),
      created_at: new Date().toISOString()
    };

    if (!this.data.lobbyMessages) {
      this.data.lobbyMessages = [];
    }

    this.data.lobbyMessages.push(msg);
    // Limit store memory to recent 30 messages
    if (this.data.lobbyMessages.length > 30) {
      this.data.lobbyMessages = this.data.lobbyMessages.slice(-30);
    }

    this.saveAndBroadcast();
  }

  public addParticipant(name: string, department: Department): Participant {
    const participant: Participant = {
      id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      session_id: this.data.session.id,
      name: name.trim(),
      department: department,
      status: 'ONLINE',
      joined_at: new Date().toISOString()
    };

    // Remove existing if identical name
    this.data.participants = this.data.participants.filter(
      p => p.name.toLowerCase() !== name.trim().toLowerCase()
    );
    this.data.participants.push(participant);
    this.saveAndBroadcast();

    return participant;
  }

  public addDemoStudents(count: number = 30) {
    const demos = generateDemoParticipants(count);
    demos.forEach((d) => {
      const participant: Participant = {
        id: 'p_demo_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        session_id: this.data.session.id,
        name: d.name.trim(),
        department: d.department,
        status: 'ONLINE',
        is_demo: true,
        joined_at: new Date().toISOString()
      };
      this.data.participants = this.data.participants.filter(
        p => p.name.toLowerCase() !== d.name.trim().toLowerCase()
      );
      this.data.participants.push(participant);
    });
    this.saveAndBroadcast();
  }

  public simulateCaptainScores(groupId: string) {
    const presentingGroup = this.data.groups.find(g => g.id === groupId);
    if (!presentingGroup) return;

    // Eligible evaluator teams: all teams except the presenting team
    const eligibleGroups = this.data.groups.filter(g => g.id !== groupId);

    eligibleGroups.forEach((evalGroup) => {
      // Find team captain or pick any member if captain not set
      const captainId = evalGroup.captain_id || evalGroup.members[0]?.id;
      if (!captainId) return;

      const randomScore = Math.floor(7 + Math.random() * 4); // 7, 8, 9, or 10

      this.submitCaptainScore(
        groupId,
        captainId,
        evalGroup.id,
        evalGroup.group_name,
        Math.min(10, Math.max(0, randomScore))
      );
    });
  }

  public removeParticipant(participantId: string) {
    this.data.participants = this.data.participants.filter(p => p.id !== participantId);
    this.data.groups.forEach(g => {
      g.members = g.members.filter(m => m.id !== participantId);
      if (g.captain_id === participantId) {
        g.captain_id = null;
        g.captain_name = null;
      }
    });
    this.saveAndBroadcast();
  }

  public generateGroups(): Group[] {
    const newGroups = generateBalancedGroups(this.data.session.id, this.data.participants);
    this.data.groups = newGroups;

    // Update participants with their group IDs
    newGroups.forEach(g => {
      g.members.forEach(m => {
        const p = this.data.participants.find(part => part.id === m.id);
        if (p) p.group_id = g.id;
      });
    });

    this.saveAndBroadcast();
    return newGroups;
  }

  public confirmGroups() {
    this.data.session.status = 'CAPTAIN_SELECTION';
    this.saveAndBroadcast();
  }

  // --- CAPTAIN SELECTION ---
  public selectTeamCaptain(groupId: string, participantId: string) {
    const group = this.data.groups.find(g => g.id === groupId);
    if (!group) return;

    const member = group.members.find(m => m.id === participantId);
    if (!member) return;

    group.captain_id = member.id;
    group.captain_name = member.name;

    // Update is_captain on all participants
    this.data.participants.forEach(p => {
      if (p.group_id === groupId) {
        p.is_captain = p.id === member.id;
      }
    });
    group.members.forEach(m => {
      m.is_captain = m.id === member.id;
    });

    this.saveAndBroadcast();
  }

  public assignProducts(): Group[] {
    const randomProducts = getRandomizedProducts(this.data.groups.length);
    this.data.groups.forEach((g, idx) => {
      g.product = randomProducts[idx % randomProducts.length];
      g.product_id = g.product.id;
    });
    this.data.session.status = 'PRODUCT_REVEAL';
    this.saveAndBroadcast();
    return this.data.groups;
  }

  // --- 15-MINUTE BMC PREPARATION TIMER ---
  public startPrepTimer() {
    this.data.session.preparation_started_at = new Date().toISOString();
    this.data.session.status = 'PREPARATION';
    this.saveAndBroadcast();
  }

  public pausePrepTimer(remainingSecs: number) {
    this.data.session.preparation_started_at = null;
    this.data.session.preparation_duration = remainingSecs;
    this.saveAndBroadcast();
  }

  public resetPrepTimer(durationSecs = 15 * 60) {
    this.data.session.preparation_started_at = null;
    this.data.session.preparation_duration = durationSecs;
    this.saveAndBroadcast();
  }

  // --- 10-MINUTE PRODUCT STUDY TIMER ---
  public startStudyTimer() {
    this.data.session.study_started_at = new Date().toISOString();
    this.data.session.status = 'STUDY_TIME';
    this.saveAndBroadcast();
  }

  public pauseStudyTimer(remainingSecs: number) {
    this.data.session.study_started_at = null;
    this.data.session.study_duration = remainingSecs;
    this.saveAndBroadcast();
  }

  public resetStudyTimer(durationSecs = 10 * 60) {
    this.data.session.study_started_at = null;
    this.data.session.study_duration = durationSecs;
    this.saveAndBroadcast();
  }

  // --- PRESENTATIONS & 3-MIN TIMER ---
  public generatePresentationOrder(): Group[] {
    const shuffled = [...this.data.groups].sort(() => Math.random() - 0.5);
    shuffled.forEach((g, idx) => {
      g.presentation_order = idx + 1;
    });
    this.data.groups = shuffled;
    this.data.session.status = 'PRESENTATION_ORDER';
    this.data.session.current_group_id = shuffled[0]?.id || null;
    this.saveAndBroadcast();
    return shuffled;
  }

  public setCurrentPresentingGroup(groupId: string) {
    this.data.session.current_group_id = groupId;
    this.data.session.presentation_started_at = null;
    this.data.session.presentation_duration = 3 * 60;
    this.data.session.scoring_open = false;
    this.saveAndBroadcast();
  }

  public startPitchTimer() {
    this.data.session.presentation_started_at = new Date().toISOString();
    this.data.session.status = 'PRESENTATION';
    this.saveAndBroadcast();
  }

  public pausePitchTimer(remainingSecs: number) {
    this.data.session.presentation_started_at = null;
    this.data.session.presentation_duration = remainingSecs;
    this.saveAndBroadcast();
  }

  public endPitchAndOpenScoring() {
    this.data.session.presentation_started_at = null;
    this.data.session.scoring_open = true;
    this.data.session.status = 'SCORING';
    this.saveAndBroadcast();
  }

  // --- CAPTAIN SCORING (0 to 10, NO HOST SCORE) ---
  public submitPeerScore(groupId: string, captainParticipantId: string, score: number) {
    const captain = this.data.participants.find(p => p.id === captainParticipantId);
    if (!captain || !captain.is_captain) return;

    const captainGroup = this.data.groups.find(g => g.id === captain.group_id);
    if (!captainGroup) return;

    // Captain cannot rate their own team
    if (captainGroup.id === groupId) return;

    this.submitCaptainScore(
      groupId,
      captainParticipantId,
      captainGroup.id,
      captainGroup.group_name,
      score
    );
  }

  public submitCaptainScore(
    groupId: string,
    captainParticipantId: string,
    evaluatorTeamId: string,
    evaluatorTeamName: string,
    score: number
  ) {
    // Prevent duplicate scoring by the same captain for this team
    this.data.peerScores = this.data.peerScores.filter(
      ps => !(ps.group_id === groupId && ps.evaluator_participant_id === captainParticipantId)
    );

    this.data.peerScores.push({
      id: 'score_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      session_id: this.data.session.id,
      group_id: groupId,
      evaluator_participant_id: captainParticipantId,
      evaluator_team_id: evaluatorTeamId,
      evaluator_team_name: evaluatorTeamName,
      score: Math.min(10, Math.max(0, score)),
      created_at: new Date().toISOString()
    });

    this.recalculateGroupScores(groupId);
    this.saveAndBroadcast();
  }

  private recalculateGroupScores(groupId: string) {
    const group = this.data.groups.find(g => g.id === groupId);
    if (!group) return;

    const groupPeerScores = this.data.peerScores.filter(ps => ps.group_id === groupId);
    if (groupPeerScores.length > 0) {
      const sum = groupPeerScores.reduce((acc, curr) => acc + curr.score, 0);
      // Average strictly of captain marks (out of 10)
      group.final_score = parseFloat((sum / groupPeerScores.length).toFixed(1));
    }
  }

  public revealLeaderboard() {
    // Fill default realistic scores (0–10 scale) for any unrated teams
    this.data.groups.forEach(g => {
      if (!g.final_score) {
        const rand = parseFloat((7.8 + Math.random() * 1.8).toFixed(1));
        g.final_score = rand;
      }
    });

    this.data.session.status = 'LEADERBOARD';
    this.saveAndBroadcast();
  }
}

export const sessionManager = new RealtimeSessionManager();

export function useRealtimeSession() {
  const [store, setStore] = useState<StoreData>(() => sessionManager.getData());

  useEffect(() => {
    const unsubscribe = sessionManager.subscribe((newData) => {
      setStore({ ...newData });
    });
    return unsubscribe;
  }, []);

  return {
    ...store,
    actions: sessionManager
  };
}
