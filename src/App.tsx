import React, { useState, useEffect } from 'react';
import { useRealtimeSession } from './lib/realtimeStore';
import { SessionState, Participant, Department } from './types';
import { HostControlBar } from './components/common/HostControlBar';
import { HostLanding } from './components/host/HostLanding';
import { HostQRJoin } from './components/host/HostQRJoin';
import { GroupFormationAnimation } from './components/host/GroupFormationAnimation';
import { HostGroupsReview } from './components/host/HostGroupsReview';
import { CaptainSelection } from './components/host/CaptainSelection';
import { ProductReveal } from './components/host/ProductReveal';
import { PrepTimer } from './components/host/PrepTimer';
import { PresentationStage } from './components/host/PresentationStage';
import { GrandLeaderboard } from './components/host/GrandLeaderboard';

// Student Components
import { StudentJoin } from './components/student/StudentJoin';
import { StudentLobby } from './components/student/StudentLobby';
import { StudentTeamReveal } from './components/student/StudentTeamReveal';
import { StudentChallenge } from './components/student/StudentChallenge';
import { StudentRateTeam } from './components/student/StudentRateTeam';
import { StudentLeaderboard } from './components/student/StudentLeaderboard';

export const App: React.FC = () => {
  const { session, participants, groups, peerScores, lobbyMessages = [], actions } = useRealtimeSession();

  // Extract session code from URL path /join/:sessionCode or query param ?join=
  const [urlSessionCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/join\/([A-Za-z0-9_-]+)/);
      if (match && match[1]) return match[1].toUpperCase();
      const search = new URLSearchParams(window.location.search);
      const code = search.get('join');
      if (code) return code.toUpperCase();
    }
    return null;
  });

  // Mode detection: Host vs Student
  // Strictly separated: students access via /join/:sessionCode or ?join= or ?mode=student
  const [appMode] = useState<'HOST' | 'STUDENT'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      if (path.includes('/join') || search.includes('mode=student') || search.includes('join=')) {
        return 'STUDENT';
      }
    }
    return 'HOST';
  });

  // Student specific local participant identity
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bmc_live_my_participant');
      if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
      }
    }
    return null;
  });

  // Grouping animation trigger
  const [showGroupingAnim, setShowGroupingAnim] = useState(false);

  // Sync currentParticipant with store updates (e.g. group assignment and captain status)
  useEffect(() => {
    if (currentParticipant) {
      const refreshed = participants.find(p => p.id === currentParticipant.id);
      if (refreshed && (refreshed.group_id !== currentParticipant.group_id || refreshed.is_captain !== currentParticipant.is_captain)) {
        const updated = { ...currentParticipant, group_id: refreshed.group_id, is_captain: refreshed.is_captain };
        setCurrentParticipant(updated);
        localStorage.setItem('bmc_live_my_participant', JSON.stringify(updated));
      }
    }
  }, [participants, currentParticipant]);

  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
  const activeSessionCode = urlSessionCode || session.join_code;
  const studentJoinUrl = `${origin}/join/${activeSessionCode}`;

  // --- HOST ACTIONS ---
  const handleStartSession = (customCode?: string) => {
    actions.createNewSession(customCode);
    actions.setSessionState('JOINING');
  };

  const handleStartGroupingAnim = () => {
    setShowGroupingAnim(true);
  };

  const handleGroupingAnimComplete = () => {
    setShowGroupingAnim(false);
    actions.generateGroups();
    actions.setSessionState('GROUPS_READY');
  };

  // --- STUDENT ACTIONS ---
  const handleStudentJoin = (name: string, dept: Department) => {
    const p = actions.addParticipant(name, dept);
    setCurrentParticipant(p);
    localStorage.setItem('bmc_live_my_participant', JSON.stringify(p));
  };

  const myGroup = groups.find(g => 
    currentParticipant && (g.id === currentParticipant.group_id || g.members.some(m => m.id === currentParticipant.id))
  );

  const presentingGroup = groups.find(g => g.id === session.current_group_id) || groups[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-body selection:bg-sky-500 selection:text-slate-950 relative">
      {/* ========================================================= */}
      {/* HOST INTERFACE                                            */}
      {/* ========================================================= */}
      {appMode === 'HOST' ? (
        <div className="min-h-screen flex flex-col">
          {session.status !== 'LOBBY' && (
            <HostControlBar
              joinCode={session.join_code}
              participantCount={participants.length}
              currentStage={session.status}
              onStageChange={(newStage) => actions.setSessionState(newStage)}
            />
          )}

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
            {/* STAGE: LOBBY */}
            {session.status === 'LOBBY' && (
              <HostLanding
                onCreateSession={(code) => handleStartSession(code)}
                onJoinSession={(code) => handleStartSession(code)}
              />
            )}

            {/* STAGE: JOINING (QR + LIVE PARTICIPANTS) */}
            {session.status === 'JOINING' && (
              <HostQRJoin
                joinCode={session.join_code}
                joinUrl={studentJoinUrl}
                participants={participants}
                lobbyMessages={lobbyMessages}
                onAddParticipant={(name, dept) => actions.addParticipant(name, dept)}
                onAddDemoStudents={(count) => actions.addDemoStudents(count)}
                onRemoveParticipant={(id) => actions.removeParticipant(id)}
                onProceedToGrouping={() => handleStartGroupingAnim()}
                onClearAll={() => actions.createNewSession(session.join_code)}
              />
            )}

            {/* STAGE: GROUP FORMATION ANIMATION */}
            {showGroupingAnim && (
              <GroupFormationAnimation
                participants={participants}
                expectedGroupCount={Math.max(1, Math.round(participants.length / 6))}
                onAnimationComplete={handleGroupingAnimComplete}
              />
            )}

            {/* STAGE: GROUPS READY / REVIEW */}
            {(session.status === 'GROUPING' || session.status === 'GROUPS_READY') && !showGroupingAnim && (
              <HostGroupsReview
                groups={groups}
                totalParticipants={participants.length}
                onRandomizeAgain={() => handleStartGroupingAnim()}
                onConfirmTeams={() => {
                  actions.confirmGroups();
                }}
              />
            )}

            {/* STAGE: CAPTAIN SELECTION */}
            {session.status === 'CAPTAIN_SELECTION' && (
              <CaptainSelection
                groups={groups}
                onSelectCaptain={(groupId, participantId) => actions.selectTeamCaptain(groupId, participantId)}
                onProceedToProducts={() => actions.assignProducts()}
              />
            )}

            {/* STAGE: PRODUCT REVEAL */}
            {(session.status === 'PRODUCT_REVEAL' || session.status === 'PRODUCT_ASSIGNMENT') && (
              <ProductReveal
                groups={groups}
                onAssignProducts={() => actions.assignProducts()}
                onProceedToPrep={() => {
                  actions.resetPrepTimer(15 * 60);
                  actions.setSessionState('PREPARATION');
                }}
              />
            )}

            {/* STAGE 1: 15-MINUTE PREPARATION TIMER */}
            {session.status === 'PREPARATION' && (
              <PrepTimer
                stage="PREPARATION"
                startedAt={session.preparation_started_at}
                duration={session.preparation_duration}
                onStart={() => actions.startPrepTimer()}
                onPause={(remaining) => actions.pausePrepTimer(remaining)}
                onReset={() => actions.resetPrepTimer(15 * 60)}
                onProceedToNext={() => {
                  actions.resetStudyTimer(10 * 60);
                  actions.setSessionState('STUDY_TIME');
                }}
              />
            )}

            {/* STAGE 2: 10-MINUTE PRODUCT STUDY TIMER */}
            {session.status === 'STUDY_TIME' && (
              <PrepTimer
                stage="STUDY_TIME"
                startedAt={session.study_started_at}
                duration={session.study_duration}
                onStart={() => actions.startStudyTimer()}
                onPause={(remaining) => actions.pauseStudyTimer(remaining)}
                onReset={() => actions.resetStudyTimer(10 * 60)}
                onProceedToNext={() => actions.generatePresentationOrder()}
              />
            )}

            {/* STAGE: PRESENTATION ORDER & 3-MIN PITCH */}
            {(session.status === 'PRESENTATION_ORDER' ||
              session.status === 'PRESENTATION' ||
              session.status === 'SCORING') && (
              <PresentationStage
                groups={groups}
                currentGroupId={session.current_group_id}
                pitchStartedAt={session.presentation_started_at}
                pitchDuration={session.presentation_duration}
                scoringOpen={Boolean(session.scoring_open)}
                peerScores={peerScores}
                totalParticipants={participants.length}
                onGenerateOrder={() => actions.generatePresentationOrder()}
                onSelectGroup={(id) => actions.setCurrentPresentingGroup(id)}
                onStartPitch={() => actions.startPitchTimer()}
                onPausePitch={(rem) => actions.pausePitchTimer(rem)}
                onEndPitch={() => actions.endPitchAndOpenScoring()}
                onSimulateCaptainScores={(groupId) => actions.simulateCaptainScores(groupId)}
                onProceedToLeaderboard={() => actions.revealLeaderboard()}
              />
            )}

            {/* STAGE: GRAND LEADERBOARD PODIUM */}
            {(session.status === 'LEADERBOARD' || session.status === 'FINAL_RESULTS' || session.status === 'COMPLETED') && (
              <GrandLeaderboard
                groups={groups}
                onRestartSession={() => handleStartSession()}
              />
            )}
          </main>
        </div>
      ) : (
        /* ========================================================= */
        /* STUDENT MOBILE INTERFACE                                  */
        /* (Strictly separated: NO Host Switch button or controls)   */
        /* ========================================================= */
        <div className="min-h-screen bg-slate-950">
          {!currentParticipant ? (
            <StudentJoin
              joinCode={activeSessionCode}
              onJoin={handleStudentJoin}
            />
          ) : session.status === 'LOBBY' || session.status === 'JOINING' ? (
            <StudentLobby
              participant={currentParticipant}
              joinCode={session.join_code}
              sessionStatus={session.status}
              messages={lobbyMessages}
              onSendMessage={(pId, pName, text) => actions.sendLobbyMessage(pId, pName, text)}
            />
          ) : (session.status === 'GROUPING' || session.status === 'GROUPS_READY' || session.status === 'CAPTAIN_SELECTION') ? (
            myGroup ? (
              <StudentTeamReveal
                group={myGroup}
                currentParticipant={currentParticipant}
              />
            ) : (
              <StudentLobby
                participant={currentParticipant}
                joinCode={session.join_code}
                sessionStatus={session.status}
                messages={lobbyMessages}
                onSendMessage={(pId, pName, text) => actions.sendLobbyMessage(pId, pName, text)}
              />
            )
          ) : session.status === 'PRODUCT_REVEAL' || session.status === 'PRODUCT_ASSIGNMENT' || session.status === 'PREPARATION' ? (
            myGroup ? (
              <StudentChallenge
                group={myGroup}
                stage="PREPARATION"
                startedAt={session.preparation_started_at}
                duration={session.preparation_duration}
              />
            ) : (
              <div className="p-8 text-center text-slate-400">Loading team challenge...</div>
            )
          ) : session.status === 'STUDY_TIME' ? (
            myGroup ? (
              <StudentChallenge
                group={myGroup}
                stage="STUDY_TIME"
                startedAt={session.study_started_at}
                duration={session.study_duration}
              />
            ) : (
              <div className="p-8 text-center text-slate-400">Loading study timer...</div>
            )
          ) : session.status === 'PRESENTATION' || session.status === 'SCORING' || session.status === 'PRESENTATION_ORDER' ? (
            presentingGroup ? (
              <StudentRateTeam
                presentingGroup={presentingGroup}
                currentParticipant={currentParticipant}
                alreadySubmitted={peerScores.some(ps => ps.group_id === presentingGroup.id && ps.evaluator_participant_id === currentParticipant.id)}
                onSubmitScore={(score) => actions.submitPeerScore(presentingGroup.id, currentParticipant.id, score)}
              />
            ) : (
              <div className="p-8 text-center text-slate-400">Waiting for presentation...</div>
            )
          ) : session.status === 'LEADERBOARD' || session.status === 'FINAL_RESULTS' || session.status === 'COMPLETED' ? (
            <StudentLeaderboard
              groups={groups}
              currentParticipant={currentParticipant}
            />
          ) : (
            <StudentLobby
              participant={currentParticipant}
              joinCode={session.join_code}
              sessionStatus={session.status}
              messages={lobbyMessages}
              onSendMessage={(pId, pName, text) => actions.sendLobbyMessage(pId, pName, text)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default App;
