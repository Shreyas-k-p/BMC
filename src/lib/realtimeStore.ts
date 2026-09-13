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
      // 1. Initial Database Fetch
      this.pullFromSupabase();

      // 2. Realtime Subscriptions for participants, sessions, lobby_messages, groups
      supabase
        .channel('bmc_live_realtime_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, (payload) => {
          this.handleParticipantRealtimeEvent(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lobby_messages' }, (payload) => {
          this.handleLobbyMessageRealtimeEvent(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, (payload) => {
          this.handleSessionRealtimeEvent(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, (payload) => {
          this.handleGroupRealtimeEvent(payload);
        })
        .subscribe();
    } catch(e) {
      console.error('Supabase subscription error:', e);
    }
  }

  private handleParticipantRealtimeEvent(payload: any) {
    if (!payload.new && !payload.old) return;
    const item = payload.new || payload.old;
    if (item && item.session_id === this.data.session.id) {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const index = this.data.participants.findIndex(p => p.id === item.id);
        if (index >= 0) {
          this.data.participants[index] = item as Participant;
        } else {
          this.data.participants.push(item as Participant);
        }
      } else if (payload.eventType === 'DELETE') {
        this.data.participants = this.data.participants.filter(p => p.id !== item.id);
      }
      this.saveAndBroadcast();
    }
  }

  private handleLobbyMessageRealtimeEvent(payload: any) {
    if (payload.eventType === 'INSERT' && payload.new && payload.new.session_id === this.data.session.id) {
      const msg = payload.new as LobbyMessage;
      if (!this.data.lobbyMessages) this.data.lobbyMessages = [];
      if (!this.data.lobbyMessages.some(m => m.id === msg.id)) {
        this.data.lobbyMessages.push(msg);
        if (this.data.lobbyMessages.length > 30) {
          this.data.lobbyMessages = this.data.lobbyMessages.slice(-30);
        }
        this.saveAndBroadcast();
      }
    }
  }

  private handleSessionRealtimeEvent(payload: any) {
    if (payload.new && payload.new.id === this.data.session.id) {
      this.data.session.status = payload.new.status as SessionState;
      if (payload.new.status !== 'LOBBY' && payload.new.status !== 'JOINING') {
        this.data.lobbyMessages = [];
      }
      this.saveAndBroadcast();
    }
  }

  private handleGroupRealtimeEvent(payload: any) {
    if (payload.new && payload.new.session_id === this.data.session.id) {
      this.pullFromSupabase();
    }
  }

  private async pullFromSupabase() {
    if (!supabase) return;
    try {
      // 1. Fetch session matching current join code or ID
      const { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('join_code', this.data.session.join_code)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (session) {
        this.data.session = {
          ...this.data.session,
          ...session
        };
      }

      // 2. Fetch all participants for current session_id (BOTH real and demo)
      const { data: dbParticipants } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', this.data.session.id)
        .order('joined_at', { ascending: true });

      if (dbParticipants) {
        this.data.participants = dbParticipants as Participant[];
      }

      // 3. Fetch all lobby messages for current session_id
      const { data: dbMessages } = await supabase
        .from('lobby_messages')
        .select('*')
        .eq('session_id', this.data.session.id)
        .order('created_at', { ascending: true });

      if (dbMessages) {
        this.data.lobbyMessages = dbMessages as LobbyMessage[];
      }

      this.saveAndBroadcast();
    } catch(e) {
      console.error('Error pulling data from Supabase:', e);
    }
  }

  private async ensureSessionExistsInSupabase() {
    if (!supabase) return;
    try {
      const { data: existing } = await supabase
        .from('sessions')
        .select('id')
        .eq('id', this.data.session.id)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from('sessions').insert({
          id: this.data.session.id,
          join_code: this.data.session.join_code,
          status: this.data.session.status,
          host_key: this.data.session.host_key,
          created_at: this.data.session.created_at,
          preparation_duration: this.data.session.preparation_duration,
          study_duration: this.data.session.study_duration,
          presentation_duration: this.data.session.presentation_duration
        });
        if (error) {
          console.error('Error inserting session in Supabase:', error);
        }
      }
    } catch(e) {
      console.error('Error ensuring session in Supabase:', e);
    }
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

  private startHeartbeatPolling() {
    if (typeof window === 'undefined') return;
    setInterval(() => {
      if (this.data.session.status === 'LOBBY' || this.data.session.status === 'JOINING') {
        this.pullFromSupabase();
      }
    }, 3000);
  }

  public async syncSessionByJoinCode(joinCode: string, mode: 'HOST' | 'STUDENT' = 'HOST'): Promise<Session | null> {
    if (!joinCode) return null;
    const code = joinCode.toUpperCase().trim();
    this.data.session.join_code = code;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: existingSession } = await supabase
          .from('sessions')
          .select('*')
          .eq('join_code', code)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingSession) {
          this.data.session = {
            ...this.data.session,
            ...existingSession
          };
          if (mode === 'HOST') {
            console.log(`HOST SESSION ID:\n${existingSession.id}`);
          } else {
            console.log(`STUDENT SESSION ID:\n${existingSession.id}`);
          }
          await this.pullFromSupabase();
          return existingSession as Session;
        } else if (mode === 'HOST') {
          await this.createNewSession(code);
          return this.data.session;
        }
      } catch (e) {
        console.error('Error syncing session by join code:', e);
      }
    }
    return null;
  }

  public async createNewSession(joinCode?: string) {
    const code = joinCode?.toUpperCase().trim() || 'BMC' + Math.floor(100 + Math.random() * 900);
    const newSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    this.data = {
      session: {
        id: newSessionId,
        join_code: code,
        status: 'JOINING',
        host_key: 'host_key_' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        preparation_duration: 15 * 60,
        study_duration: 10 * 60,
        presentation_duration: 3 * 60,
        scoring_open: false
      },
      participants: [],
      groups: [],
      peerScores: [],
      lobbyMessages: []
    };

    console.log(`HOST SESSION ID:\n${this.data.session.id}`);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('sessions').upsert({
          id: this.data.session.id,
          join_code: this.data.session.join_code,
          status: this.data.session.status,
          host_key: this.data.session.host_key,
          created_at: this.data.session.created_at,
          preparation_duration: this.data.session.preparation_duration,
          study_duration: this.data.session.study_duration,
          presentation_duration: this.data.session.presentation_duration
        }, { onConflict: 'join_code' });
        if (error) {
          console.error('Error upserting new session in Supabase:', error);
        }
      } catch(e) {
        console.error('Exception upserting new session in Supabase:', e);
      }
    }

    this.saveAndBroadcast();
    await this.pullFromSupabase();
  }

  public async setSessionState(status: SessionState) {
    this.data.session.status = status;
    if (status !== 'LOBBY' && status !== 'JOINING') {
      this.data.lobbyMessages = [];
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('sessions').update({ status }).eq('id', this.data.session.id);
      } catch(e) {
        console.error('Error updating session status in Supabase:', e);
      }
    }

    this.saveAndBroadcast();
  }

  public async sendLobbyMessage(participantId: string, participantName: string, text: string) {
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

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('lobby_messages').insert({
        id: msg.id,
        session_id: msg.session_id,
        participant_id: msg.participant_id,
        participant_name: msg.participant_name,
        message: msg.message,
        created_at: msg.created_at
      });
      if (error) {
        console.error('Supabase message insert error:', error);
      }
    }

    if (!this.data.lobbyMessages) this.data.lobbyMessages = [];
    this.data.lobbyMessages.push(msg);
    if (this.data.lobbyMessages.length > 30) {
      this.data.lobbyMessages = this.data.lobbyMessages.slice(-30);
    }

    this.saveAndBroadcast();
  }

  public async addParticipant(name: string, department: Department, targetJoinCode?: string): Promise<Participant> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Name is required.');
    }

    const codeToUse = (targetJoinCode || this.data.session.join_code || 'BMC2026').toUpperCase().trim();
    this.data.session.join_code = codeToUse;

    if (!isSupabaseConfigured || !supabase) {
      console.error('Supabase is not configured on this environment (missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY).');
      throw new Error('Unable to join session. Realtime database connection is not configured.');
    }

    // 1. Mandatory Supabase Session Resolution by join code
    let dbSession = null;
    try {
      const { data, error: sessErr } = await supabase
        .from('sessions')
        .select('*')
        .eq('join_code', codeToUse)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessErr) {
        console.error('Supabase session fetch error:', sessErr);
      }
      dbSession = data;
    } catch (e) {
      console.error('Exception fetching session from Supabase:', e);
    }

    // If session row is missing in Supabase, auto-create it
    if (!dbSession) {
      console.warn(`Session "${codeToUse}" not found in Supabase. Auto-creating session...`);
      const autoSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const { error: createErr } = await supabase.from('sessions').insert({
        id: autoSessionId,
        join_code: codeToUse,
        status: 'JOINING',
        host_key: 'host_key_' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        preparation_duration: 15 * 60,
        study_duration: 10 * 60,
        presentation_duration: 3 * 60,
        scoring_open: false
      });

      if (createErr) {
        console.error('Error auto-creating session in Supabase:', createErr);
        throw new Error(`Unable to join session "${codeToUse}". Session has not been created by host.`);
      }

      this.data.session = {
        ...this.data.session,
        id: autoSessionId,
        join_code: codeToUse,
        status: 'JOINING'
      };
    } else {
      this.data.session = {
        ...this.data.session,
        ...dbSession
      };
    }

    console.log(`STUDENT SESSION ID:\n${this.data.session.id}`);

    // 2. Session Validation
    if (this.data.session.status !== 'LOBBY' && this.data.session.status !== 'JOINING') {
      throw new Error('Unable to join the session. Session is no longer accepting new participants.');
    }

    // 3. Check duplicate participant identity in current session
    let existing = this.data.participants.find(
      p => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existing) {
      existing.department = department;
      existing.status = 'ONLINE';
      existing.last_seen_at = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from('participants')
        .update({ department: existing.department, status: existing.status, last_seen_at: existing.last_seen_at })
        .eq('id', existing.id);
      if (updateErr) {
        console.error('Supabase participant update error:', updateErr);
        throw new Error('Unable to update join status. Please try again.');
      }
      this.saveAndBroadcast();
      return existing;
    }

    const participant: Participant = {
      id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 100000),
      session_id: this.data.session.id,
      name: trimmedName,
      department: department,
      status: 'ONLINE',
      joined_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      is_demo: false
    };

    // 4. Database Insert via Supabase (MUST WAIT and verify response)
    const { error: insertErr } = await supabase.from('participants').insert({
      id: participant.id,
      session_id: participant.session_id,
      name: participant.name,
      department: participant.department,
      status: participant.status,
      joined_at: participant.joined_at,
      last_seen_at: participant.last_seen_at,
      is_demo: false
    });

    if (insertErr) {
      console.error('Supabase participant INSERT error:', insertErr);
      throw new Error(insertErr.message || 'Unable to join the session. Please try again.');
    }

    // 5. Update local state & broadcast ONLY after DB insert succeeds
    this.data.participants.push(participant);
    this.saveAndBroadcast();
    return participant;
  }

  public addDemoStudents(count: number = 30) {
    const demos = generateDemoParticipants(count);
    demos.forEach(async (d) => {
      const participant: Participant = {
        id: 'p_demo_' + Date.now() + '_' + Math.floor(Math.random() * 100000),
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

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('participants').insert({
            id: participant.id,
            session_id: participant.session_id,
            name: participant.name,
            department: participant.department,
            status: participant.status,
            joined_at: participant.joined_at,
            is_demo: true
          });
        } catch(e) {}
      }
    });

    this.saveAndBroadcast();
  }

  public simulateCaptainScores(groupId: string) {
    const presentingGroup = this.data.groups.find(g => g.id === groupId);
    if (!presentingGroup) return;

    const eligibleGroups = this.data.groups.filter(g => g.id !== groupId);

    eligibleGroups.forEach((evalGroup) => {
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

    if (isSupabaseConfigured && supabase) {
      supabase.from('participants').delete().eq('id', participantId).then(() => {}, () => {});
    }

    this.saveAndBroadcast();
  }

  public generateGroups(): Group[] {
    const newGroups = generateBalancedGroups(this.data.session.id, this.data.participants);
    this.data.groups = newGroups;

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

  public selectTeamCaptain(groupId: string, participantId: string) {
    const group = this.data.groups.find(g => g.id === groupId);
    if (!group) return;

    const member = group.members.find(m => m.id === participantId);
    if (!member) return;

    group.captain_id = member.id;
    group.captain_name = member.name;

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

  public submitPeerScore(groupId: string, captainParticipantId: string, score: number) {
    const captain = this.data.participants.find(p => p.id === captainParticipantId);
    if (!captain || !captain.is_captain) return;

    const captainGroup = this.data.groups.find(g => g.id === captain.group_id);
    if (!captainGroup) return;

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
    this.data.peerScores = this.data.peerScores.filter(
      ps => !(ps.group_id === groupId && ps.evaluator_participant_id === captainParticipantId)
    );

    const newScore: PeerScore = {
      id: 'score_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      session_id: this.data.session.id,
      group_id: groupId,
      evaluator_participant_id: captainParticipantId,
      evaluator_team_id: evaluatorTeamId,
      evaluator_team_name: evaluatorTeamName,
      score: Math.min(10, Math.max(0, score)),
      created_at: new Date().toISOString()
    };

    this.data.peerScores.push(newScore);

    if (isSupabaseConfigured && supabase) {
      supabase.from('peer_scores').insert(newScore).then(() => {}, () => {});
    }

    this.recalculateGroupScores(groupId);
    this.saveAndBroadcast();
  }

  private recalculateGroupScores(groupId: string) {
    const group = this.data.groups.find(g => g.id === groupId);
    if (!group) return;

    const groupPeerScores = this.data.peerScores.filter(ps => ps.group_id === groupId);
    if (groupPeerScores.length > 0) {
      const sum = groupPeerScores.reduce((acc, curr) => acc + curr.score, 0);
      group.final_score = parseFloat((sum / groupPeerScores.length).toFixed(1));
    }
  }

  public revealLeaderboard() {
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
