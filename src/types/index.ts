// =========================================================
// BMC LIVE: TYPESCRIPT INTERFACES & DOMAIN MODELS
// =========================================================

export type SessionState =
  | 'LOBBY'
  | 'JOINING'
  | 'GROUPING'
  | 'GROUPS_READY'
  | 'CAPTAIN_SELECTION'
  | 'PRODUCT_REVEAL'
  | 'PRODUCT_ASSIGNMENT'
  | 'PREPARATION'
  | 'STUDY_TIME'
  | 'PRESENTATION_ORDER'
  | 'PRESENTATION'
  | 'SCORING'
  | 'LEADERBOARD'
  | 'FINAL_RESULTS'
  | 'COMPLETED';

export type Department =
  | 'AI'
  | 'CSE'
  | 'CY'
  | 'ME'
  | 'CE'
  | 'ECE'
  | 'EEE'
  | 'IC';

export interface Product {
  id: string;
  name: string;
  company: string;
  category: 'FAILED' | 'SUCCESSFUL';
}

export interface Participant {
  id: string;
  session_id: string;
  name: string;
  department: Department;
  status: 'ONLINE' | 'OFFLINE';
  group_id?: string | null;
  is_captain?: boolean;
  is_demo?: boolean;
  joined_at: string;
  last_seen_at?: string;
}

export interface Group {
  id: string;
  session_id: string;
  group_number: number;
  group_name: string; // "TEAM 1", "TEAM 2", etc.
  captain_id?: string | null;
  captain_name?: string | null;
  product_id?: string | null;
  product?: Product | null;
  members: Participant[];
  presentation_order?: number | null;
  final_score?: number | null; // Average of captain marks (0–10)
  created_at?: string;
}

export interface Session {
  id: string;
  code: string;
  join_code: string;
  status: SessionState;
  host_key: string;
  created_at: string;
  preparation_started_at?: string | null;
  preparation_duration: number; // 900s for 15 min BMC prep
  study_started_at?: string | null;
  study_duration: number; // 600s for 10 min product study
  current_group_id?: string | null;
  presentation_started_at?: string | null;
  presentation_duration: number; // 180s for 3 min presentation
  scoring_open?: boolean;
}

export interface PeerScore {
  id: string;
  session_id: string;
  group_id: string; // The team being scored
  evaluator_participant_id: string; // The captain scoring
  evaluator_team_id: string; // The captain's own team
  evaluator_team_name: string; // e.g. "TEAM 1"
  score: number; // 0 to 10
  created_at: string;
}

export interface LobbyMessage {
  id: string;
  session_id: string;
  participant_id: string;
  participant_name: string;
  message: string;
  created_at: string;
}

export interface GroupingRecommendation {
  possible: boolean;
  participantCount: number;
  groupCount: number;
  groupSizes: number[];
  reason?: string;
}
