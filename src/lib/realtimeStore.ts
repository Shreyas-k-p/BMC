import { useState, useEffect } from 'react';
import { Session, Participant, Group, PeerScore, SessionState, Department, LobbyMessage } from '../types';
import { getRandomizedProducts } from './products';
import { generateBalancedGroups } from './grouping';
import { generateDemoParticipants } from './mockData';
import { supabase, isSupabaseConfigured, supabaseUrl } from './supabase';

interface StoreData {
  hasActiveSession: boolean;
  session: Session;
  participants: Participant[];
  groups: Group[];
  peerScores: PeerScore[];
  lobbyMessages: LobbyMessage[];
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randStr = '';
  for (let i = 0; i < 4; i++) {
    randStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'BMC' + randStr;
}

function toDbStatus(status: SessionState): string {
  switch (status) {
    case 'LOBBY':
    case 'JOINING':
    case 'GROUPING':
    case 'GROUPS_READY':
    case 'CAPTAIN_SELECTION':
    case 'PRODUCT_REVEAL':
    case 'PRODUCT_ASSIGNMENT':
      return 'LOBBY';
    case 'PREPARATION':
      return 'PREPARATION';
    case 'STUDY_TIME':
      return 'STUDY';
    case 'PRESENTATION_ORDER':
    case 'PRESENTATION':
      return 'PRESENTATION';
    case 'SCORING':
      return 'SCORING';
    case 'LEADERBOARD':
    case 'FINAL_RESULTS':
      return 'LEADERBOARD';
    case 'COMPLETED':
      return 'COMPLETED';
    default:
      return 'LOBBY';
  }
}

function fromDbStatus(dbStatus: string | undefined, currentUiStatus: SessionState): SessionState {
  if (!dbStatus) return currentUiStatus;

  // RULE: When HOST local state is JOINING and Supabase returns LOBBY, DO NOT overwrite local JOINING state.
  if (dbStatus === 'LOBBY') {
    return currentUiStatus === 'JOINING' ? 'JOINING' : 'LOBBY';
  }

  if (dbStatus === 'PREPARATION') return 'PREPARATION';
  if (dbStatus === 'STUDY') return 'STUDY_TIME';
  if (dbStatus === 'PRESENTATION') {
    return (currentUiStatus === 'PRESENTATION_ORDER' || currentUiStatus === 'PRESENTATION')
      ? currentUiStatus
      : 'PRESENTATION';
  }
  if (dbStatus === 'SCORING') return 'SCORING';
  if (dbStatus === 'LEADERBOARD') {
    return (currentUiStatus === 'FINAL_RESULTS' || currentUiStatus === 'COMPLETED')
      ? currentUiStatus
      : 'LEADERBOARD';
  }
  if (dbStatus === 'COMPLETED') return 'COMPLETED';

  return (dbStatus as SessionState) || currentUiStatus;
}

function getDefaultStore(): StoreData {
  return {
    hasActiveSession: false,
    session: {
      id: generateUUID(),
      code: generateSessionCode(),
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
  private creatingSession = false;

  constructor() {
    this.data = getDefaultStore();

    // Supabase Realtime is the single source of truth for cross-client state.
    if (isSupabaseConfigured && supabase) {
      this.initSupabaseSubscriptions();
      this.startHeartbeatPolling();
    }
  }

  private initSupabaseSubscriptions() {
    if (!supabase) return;
    try {
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
      console.log(`[BMC STATE] SUPABASE REALTIME PARTICIPANT EVENT (${payload.eventType}) SESSION ID: ${this.data.session.id}`);
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
      this.notifyListeners();
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
        this.notifyListeners();
      }
    }
  }

  private handleSessionRealtimeEvent(payload: any) {
    if (payload.new && payload.new.id === this.data.session.id) {
      const dbStatus = payload.new.status as string;
      const mergedStatus = fromDbStatus(dbStatus, this.data.session.status);
      console.log(`[BMC STATE] SUPABASE REALTIME BEFORE: ${this.data.session.status} AFTER: ${mergedStatus} SESSION ID: ${this.data.session.id}`);

      this.data.session.status = mergedStatus;
      if (mergedStatus !== 'LOBBY' && mergedStatus !== 'JOINING') {
        this.data.lobbyMessages = [];
      }
      this.notifyListeners();
    }
  }

  private handleGroupRealtimeEvent(payload: any) {
    if (payload.new && payload.new.session_id === this.data.session.id) {
      this.pullFromSupabase();
    }
  }

  private async pullFromSupabase() {
    if (!supabase || !this.data.hasActiveSession) return;
    try {
      const activeId = this.data.session.id;
      const activeCode = this.data.session.code;

      // Fetch session matching current active session ID
      const { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', activeId)
        .maybeSingle();

      if (session && session.id === activeId) {
        const mergedStatus = fromDbStatus(session.status, this.data.session.status);
        console.log(`[BMC STATE] SUPABASE FETCH BEFORE: ${this.data.session.status} AFTER: ${mergedStatus} SESSION ID: ${activeId}`);

        this.data.session = {
          ...this.data.session,
          ...session,
          code: session.code || activeCode,
          status: mergedStatus
        };
      }

      // Fetch all participants for current active session_id
      const { data: dbParticipants } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', activeId)
        .order('joined_at', { ascending: true });

      if (dbParticipants) {
        this.data.participants = dbParticipants as Participant[];
      }

      // Fetch all lobby messages for current active session_id
      const { data: dbMessages } = await supabase
        .from('lobby_messages')
        .select('*')
        .eq('session_id', activeId)
        .order('created_at', { ascending: true });

      if (dbMessages) {
        this.data.lobbyMessages = dbMessages as LobbyMessage[];
      }

      this.notifyListeners();
    } catch(e) {
      console.error('Error pulling data from Supabase:', e);
    }
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
    setInterval(async () => {
      if (!this.data.hasActiveSession || !supabase) return;

      // Heartbeat ONLY refreshes participants for the active session ID.
      // It MUST NOT touch or mutate this.data.session.status!
      try {
        const { data: dbParticipants } = await supabase
          .from('participants')
          .select('*')
          .eq('session_id', this.data.session.id)
          .order('joined_at', { ascending: true });

        if (dbParticipants) {
          const countBefore = this.data.participants.length;
          this.data.participants = dbParticipants as Participant[];
          if (countBefore !== dbParticipants.length) {
            console.log(`[BMC STATE] HEARTBEAT PARTICIPANTS UPDATE (count: ${dbParticipants.length}) SESSION ID: ${this.data.session.id}`);
            this.notifyListeners();
          }
        }
      } catch(e) {}
    }, 3000);
  }

  public async syncSessionByJoinCode(joinCode: string): Promise<Session | null> {
    if (!joinCode) return null;
    const code = joinCode.toUpperCase().trim();

    console.log('[BMC STATE] STUDENT SYNC BY CODE:', code);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: existingSession, error: syncErr } = await supabase
          .from('sessions')
          .select('*')
          .eq('code', code)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('[BMC STATE] STUDENT SYNC RESULT', { data: existingSession, error: syncErr });

        if (existingSession) {
          const mergedStatus = fromDbStatus(existingSession.status, this.data.session.status);
          console.log(`[BMC STATE] STUDENT SYNC BEFORE: ${this.data.session.status} AFTER: ${mergedStatus} SESSION ID: ${existingSession.id}`);

          this.data.hasActiveSession = true;
          this.data.session = {
            ...this.data.session,
            ...existingSession,
            code: existingSession.code || code,
            status: mergedStatus
          };

          await this.pullFromSupabase();
          return existingSession as Session;
        }
      } catch (e) {
        console.error('[BMC] Error syncing session by join code:', e);
      }
    }
    return null;
  }

  public async createNewSession(customCode?: string) {
    if (this.creatingSession) {
      console.warn('[BMC STATE] CREATE SESSION IGNORED: creation already in progress');
      return;
    }

    this.creatingSession = true;

    try {
      let code = customCode?.toUpperCase().trim() || generateSessionCode();
      let insertedData = null;
      let attempts = 0;

      while (!insertedData && attempts < 3) {
        attempts++;
        const newSessionId = generateUUID();

        console.log(`[BMC STATE] HOST CREATE -> JOINING (attempt: ${attempts}, code: ${code}, id: ${newSessionId})`);
        console.log('[BMC] SUPABASE URL:', supabaseUrl);

        if (!isSupabaseConfigured || !supabase) {
          console.error('[BMC] Supabase is not configured on this environment.');
          throw new Error('Unable to create session. Realtime database connection is not configured.');
        }

        const newSessionObj: Session = {
          id: newSessionId,
          code: code,
          status: 'JOINING',
          host_key: 'host_key_' + Math.random().toString(36).substring(2, 9),
          created_at: new Date().toISOString(),
          preparation_duration: 15 * 60,
          study_duration: 10 * 60,
          presentation_duration: 3 * 60,
          scoring_open: false
        };

        const dbStatus = toDbStatus(newSessionObj.status);
        const { data, error } = await supabase.from('sessions').insert({
          id: newSessionObj.id,
          code: newSessionObj.code,
          status: dbStatus
        }).select().single();

        console.log('[BMC STATE] SESSION INSERT RESULT', { data, error });

        if (error) {
          // If unique constraint violation / collision, generate a new code and retry
          if (error.code === '23505' || (error as any).status === 409 || error.message?.includes('unique constraint')) {
            console.warn(`[BMC STATE] Session code "${code}" collided. Retrying with new code...`);
            code = generateSessionCode();
            continue;
          }
          console.error('[BMC STATE] HOST CREATE FAILED IN SUPABASE:', {
            message: error?.message,
            code: error?.code,
            details: error?.details,
            hint: error?.hint
          });
          throw new Error(`Unable to create session: ${error?.message || 'Database rejected insertion'}`);
        }

        if (data) {
          insertedData = data;
          console.log('[BMC STATE] BEFORE:', this.data.session.status, 'SESSION ID:', this.data.session.id);

          this.data = {
            hasActiveSession: true,
            session: {
              ...newSessionObj,
              ...data,
              code: data.code || code,
              status: 'JOINING'
            },
            participants: [],
            groups: [],
            peerScores: [],
            lobbyMessages: []
          };

          console.log('[BMC STATE] AFTER:', this.data.session.status, 'SESSION ID:', this.data.session.id);
          console.log('[BMC STATE] SESSION CREATED SUCCESS', { id: data.id, code: data.code, status: this.data.session.status });

          this.notifyListeners();
          // Do NOT call pullFromSupabase() here. The returned row is already stored atomically.
        }
      }

      if (!insertedData) {
        throw new Error('Failed to create session after multiple attempts due to code collisions.');
      }
    } finally {
      this.creatingSession = false;
    }
  }

  public async setSessionState(status: SessionState) {
    console.log(`[BMC STATE] HOST EXPLICIT STAGE CHANGE BEFORE: ${this.data.session.status} AFTER: ${status} SESSION ID: ${this.data.session.id}`);
    this.data.session.status = status;
    if (status !== 'LOBBY' && status !== 'JOINING') {
      this.data.lobbyMessages = [];
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const dbStatus = toDbStatus(status);
        await supabase.from('sessions').update({ status: dbStatus }).eq('id', this.data.session.id);
      } catch(e) {
        console.error('[BMC] Error updating session status in Supabase:', e);
      }
    }

    this.notifyListeners();
  }

  public async sendLobbyMessage(participantId: string, participantName: string, text: string) {
    // STRICT RULE: Students can send messages ONLY while session state is LOBBY or JOINING
    if (this.data.session.status !== 'LOBBY' && this.data.session.status !== 'JOINING') {
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    const msg: LobbyMessage = {
      id: generateUUID(),
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
        console.error('[BMC] Supabase message insert error:', error);
      }
    }

    if (!this.data.lobbyMessages) this.data.lobbyMessages = [];
    this.data.lobbyMessages.push(msg);
    if (this.data.lobbyMessages.length > 30) {
      this.data.lobbyMessages = this.data.lobbyMessages.slice(-30);
    }

    this.notifyListeners();
  }

  public async addParticipant(name: string, department: Department, targetJoinCode?: string): Promise<Participant> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Name is required.');
    }

    const codeToUse = (targetJoinCode || this.data.session.code || 'BMC2026').toUpperCase().trim();

    if (!isSupabaseConfigured || !supabase) {
      console.error('[BMC] Supabase is not configured on this environment.');
      throw new Error('Unable to join session. Realtime database connection is not configured.');
    }

    console.log('[BMC STATE] STUDENT LOOKING UP SESSION CODE:', codeToUse);

    // 1. Mandatory Supabase Session Resolution by code (STRICT: NO AUTO-CREATION FROM STUDENT)
    let dbSession = null;
    try {
      const { data, error: sessErr } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', codeToUse)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('[BMC STATE] STUDENT SESSION LOOKUP RESULT', { data, error: sessErr });

      if (sessErr) {
        console.error('[BMC] Supabase session fetch error:', sessErr);
      }
      dbSession = data;
    } catch (e) {
      console.error('[BMC] Exception fetching session from Supabase:', e);
    }

    // STRICT RULE: A student must NEVER create a session.
    if (!dbSession) {
      console.error(`[BMC] Session code "${codeToUse}" not found in Supabase.`);
      throw new Error('Session not found or has not been started by the host.');
    }

    const mergedStatus = fromDbStatus(dbSession.status, this.data.session.status);
    console.log(`[BMC STATE] STUDENT ADD PARTICIPANT BEFORE: ${this.data.session.status} AFTER: ${mergedStatus} SESSION ID: ${dbSession.id}`);

    this.data.hasActiveSession = true;
    this.data.session = {
      ...this.data.session,
      ...dbSession,
      code: dbSession.code || codeToUse,
      status: mergedStatus
    };

    console.log(`[BMC STATE] STUDENT SESSION ID:\n${this.data.session.id}`);

    // 2. Session Validation (Status must be LOBBY or JOINING in UI)
    if (this.data.session.status !== 'LOBBY' && this.data.session.status !== 'JOINING') {
      throw new Error('Session is no longer accepting new participants.');
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
        console.error('[BMC] Supabase participant update error:', updateErr);
        throw new Error('Unable to update join status. Please try again.');
      }
      this.notifyListeners();
      return existing;
    }

    const participant: Participant = {
      id: generateUUID(),
      session_id: this.data.session.id,
      name: trimmedName,
      department: department,
      status: 'ONLINE',
      joined_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      is_demo: false
    };

    console.log('[BMC STATE] INSERTING PARTICIPANT', {
      id: participant.id,
      name: participant.name,
      dept: participant.department,
      session_id: participant.session_id
    });

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

    console.log('[BMC STATE] PARTICIPANT INSERT RESULT', { id: participant.id, error: insertErr });

    if (insertErr) {
      console.error('[BMC STATE] PARTICIPANT INSERT FAILED:', insertErr);
      throw new Error(insertErr.message || 'Unable to join the session. Please try again.');
    }

    // 5. Update local state & notify listeners ONLY after DB insert succeeds
    this.data.participants.push(participant);
    this.notifyListeners();
    return participant;
  }

  public addDemoStudents(count: number = 30) {
    const demos = generateDemoParticipants(count);
    demos.forEach(async (d) => {
      const participant: Participant = {
        id: generateUUID(),
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

    this.notifyListeners();
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

    this.notifyListeners();
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

    this.notifyListeners();
    return newGroups;
  }

  public confirmGroups() {
    this.setSessionState('CAPTAIN_SELECTION');
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

    this.notifyListeners();
  }

  public assignProducts(): Group[] {
    const randomProducts = getRandomizedProducts(this.data.groups.length);
    this.data.groups.forEach((g, idx) => {
      g.product = randomProducts[idx % randomProducts.length];
      g.product_id = g.product.id;
    });
    this.setSessionState('PRODUCT_REVEAL');
    return this.data.groups;
  }

  public startPrepTimer() {
    this.data.session.preparation_started_at = new Date().toISOString();
    this.setSessionState('PREPARATION');
  }

  public pausePrepTimer(remainingSecs: number) {
    this.data.session.preparation_started_at = null;
    this.data.session.preparation_duration = remainingSecs;
    this.notifyListeners();
  }

  public resetPrepTimer(durationSecs = 15 * 60) {
    this.data.session.preparation_started_at = null;
    this.data.session.preparation_duration = durationSecs;
    this.notifyListeners();
  }

  public startStudyTimer() {
    this.data.session.study_started_at = new Date().toISOString();
    this.setSessionState('STUDY_TIME');
  }

  public pauseStudyTimer(remainingSecs: number) {
    this.data.session.study_started_at = null;
    this.data.session.study_duration = remainingSecs;
    this.notifyListeners();
  }

  public resetStudyTimer(durationSecs = 10 * 60) {
    this.data.session.study_started_at = null;
    this.data.session.study_duration = durationSecs;
    this.notifyListeners();
  }

  public generatePresentationOrder(): Group[] {
    const shuffled = [...this.data.groups].sort(() => Math.random() - 0.5);
    shuffled.forEach((g, idx) => {
      g.presentation_order = idx + 1;
    });
    this.data.groups = shuffled;
    this.data.session.current_group_id = shuffled[0]?.id || null;
    this.setSessionState('PRESENTATION_ORDER');
    return shuffled;
  }

  public setCurrentPresentingGroup(groupId: string) {
    this.data.session.current_group_id = groupId;
    this.data.session.presentation_started_at = null;
    this.data.session.presentation_duration = 3 * 60;
    this.data.session.scoring_open = false;
    this.notifyListeners();
  }

  public startPitchTimer() {
    this.data.session.presentation_started_at = new Date().toISOString();
    this.setSessionState('PRESENTATION');
  }

  public pausePitchTimer(remainingSecs: number) {
    this.data.session.presentation_started_at = null;
    this.data.session.presentation_duration = remainingSecs;
    this.notifyListeners();
  }

  public endPitchAndOpenScoring() {
    this.data.session.presentation_started_at = null;
    this.data.session.scoring_open = true;
    this.setSessionState('SCORING');
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
      id: generateUUID(),
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
    this.notifyListeners();
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

    this.setSessionState('LEADERBOARD');
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
