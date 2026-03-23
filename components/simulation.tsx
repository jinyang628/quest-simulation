'use client';

import { useCallback, useMemo, useState } from 'react';

import { PLAYER_CONFIG } from '@/lib/quest/constants';
import { EVIL_ROLE_OPTIONS, GOOD_ROLE_OPTIONS } from '@/lib/quest/constants';
import type {
  EvilRoleName,
  GoodRoleName,
  MissionSubPhase,
  PLAYER_COUNTS,
  Player,
} from '@/lib/quest/constants';
import { MissionHistoryEntry } from '@/lib/quest/types';
import {
  alignmentForRole,
  countEvilOnMissionTeam,
  isGoodRole,
  pickLeaderForMission,
  shuffle,
  simulatedEvilMissionVote,
} from '@/lib/quest/utils';

import GameSetupPanel from './panels/game-setup-panel';
import MissionHistoryPanel from './panels/mission-history-panel';
import PerspectivePanel from './panels/perspective-panel';
import RosterPanel from './panels/roster-panel';
import TeamSelectionPanel from './panels/team-selection-panel';

export default function Simulation() {
  const [playerCount, setPlayerCount] = useState<(typeof PLAYER_COUNTS)[number]>(6);
  const config = PLAYER_CONFIG[playerCount];

  const [goodRoles, setGoodRoles] = useState<GoodRoleName[]>(() =>
    Array.from({ length: PLAYER_CONFIG[6].good }, () => GOOD_ROLE_OPTIONS[0]),
  );
  const [evilRoles, setEvilRoles] = useState<EvilRoleName[]>(() =>
    Array.from({ length: PLAYER_CONFIG[6].evil }, () => EVIL_ROLE_OPTIONS[0]),
  );

  const [players, setPlayers] = useState<Player[] | null>(null);
  const [missionIndex, setMissionIndex] = useState(0);
  const [leadersThisCycle, setLeadersThisCycle] = useState<Set<string>>(() => new Set());
  const [currentLeaderId, setCurrentLeaderId] = useState<string | null>(null);
  const [firstLeaderId, setFirstLeaderId] = useState<string | null>(null);
  const [missionSubPhase, setMissionSubPhase] = useState<MissionSubPhase>('propose');
  const [teamIds, setTeamIds] = useState<Set<string>>(() => new Set());
  const [votes, setVotes] = useState<Record<string, 'success' | 'fail'>>({});
  const [missionHistory, setMissionHistory] = useState<MissionHistoryEntry[]>([]);
  const [perspectivePlayerId, setPerspectivePlayerId] = useState<string>('p-0');

  const teamSize = config.missionTeamSizes[missionIndex];
  const failsRequired = config.failsRequired[missionIndex];

  const startGame = useCallback(() => {
    const pool = shuffle([...goodRoles, ...evilRoles]);
    const next: Player[] = pool.map((name, i) => ({
      id: `p-${i}`,
      label: `Player ${i + 1}`,
      name,
      alignment: alignmentForRole(name),
    }));
    setPlayers(next);
    setMissionIndex(0);
    setMissionHistory([]);
    const { leader, nextCycle } = pickLeaderForMission(
      next.map((p) => p.id),
      new Set(),
    );
    setLeadersThisCycle(nextCycle);
    setCurrentLeaderId(leader);
    setFirstLeaderId(leader);
    setMissionSubPhase('propose');
    setTeamIds(new Set(leader ? [leader] : []));
    setVotes({});
    setPerspectivePlayerId('p-0');
  }, [goodRoles, evilRoles]);

  const resetToSetup = useCallback(() => {
    setPlayers(null);
    setMissionIndex(0);
    setLeadersThisCycle(new Set());
    setCurrentLeaderId(null);
    setFirstLeaderId(null);
    setMissionSubPhase('propose');
    setTeamIds(new Set());
    setVotes({});
    setMissionHistory([]);
    setPerspectivePlayerId('p-0');
  }, []);

  const toggleTeamMember = useCallback(
    (id: string, checked: boolean) => {
      if (currentLeaderId && id === currentLeaderId && !checked) return;
      setTeamIds((prev) => {
        const next = new Set(prev);
        if (checked) {
          if (next.size >= teamSize) return prev;
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    },
    [teamSize, currentLeaderId],
  );

  const confirmTeam = useCallback(() => {
    if (teamIds.size !== teamSize || !players) return;
    const evilOnTeam = countEvilOnMissionTeam(teamIds, players);
    const initial: Record<string, 'success' | 'fail'> = {};
    for (const id of teamIds) {
      const p = players.find((x) => x.id === id);
      if (!p) continue;
      if (isGoodRole(p.name)) {
        initial[id] = 'success';
      } else {
        initial[id] = simulatedEvilMissionVote(failsRequired, evilOnTeam);
      }
    }
    setVotes(initial);
    setMissionSubPhase('play');
  }, [teamIds, teamSize, players, failsRequired]);

  const resolveMission = useCallback(() => {
    if (!players) return;
    let failCount = 0;
    for (const id of teamIds) {
      if (votes[id] === 'fail') failCount += 1;
    }
    const teamSizeResolved = teamIds.size;
    const successCount = teamSizeResolved - failCount;
    const passed = failCount < failsRequired;
    const leaderPlayerResolved =
      currentLeaderId !== null ? (players.find((p) => p.id === currentLeaderId) ?? null) : null;
    const orderedTeamIds =
      currentLeaderId && teamIds.has(currentLeaderId)
        ? [currentLeaderId, ...[...teamIds].filter((id) => id !== currentLeaderId)]
        : [...teamIds];
    const team: MissionHistoryEntry['team'] = [];
    for (const id of orderedTeamIds) {
      const p = players.find((x) => x.id === id);
      if (!p) continue;
      const card = votes[id] === 'fail' ? 'fail' : 'success';
      team.push({ id: p.id, label: p.label, name: p.name, card });
    }
    setMissionHistory((r) => [
      ...r,
      {
        mission: missionIndex + 1,
        passed,
        failCount,
        successCount,
        failsRequired,
        leader: leaderPlayerResolved
          ? {
              id: leaderPlayerResolved.id,
              label: leaderPlayerResolved.label,
              name: leaderPlayerResolved.name,
            }
          : null,
        team,
      },
    ]);
    setMissionSubPhase('result');
  }, [players, teamIds, votes, failsRequired, missionIndex, currentLeaderId]);

  const advanceMission = useCallback(() => {
    if (!players) return;
    if (missionIndex >= 4) return;
    const { leader, nextCycle } = pickLeaderForMission(
      players.map((p) => p.id),
      leadersThisCycle,
    );
    setMissionIndex((m) => m + 1);
    setMissionSubPhase('propose');
    setTeamIds(new Set(leader ? [leader] : []));
    setVotes({});
    setCurrentLeaderId(leader);
    setLeadersThisCycle(nextCycle);
  }, [players, missionIndex, leadersThisCycle]);

  const leaderPlayer = useMemo(
    () => players?.find((p) => p.id === currentLeaderId) ?? null,
    [players, currentLeaderId],
  );
  const perspectivePlayer = useMemo(
    () => players?.find((p) => p.id === perspectivePlayerId) ?? null,
    [players, perspectivePlayerId],
  );

  const visibleRoleIds = useMemo(() => {
    const visible = new Set<string>();
    if (!players || !perspectivePlayer) return visible;
    visible.add(perspectivePlayer.id);
    if (
      perspectivePlayer.name === 'Minion of Mordred' ||
      perspectivePlayer.name === 'Morgan le Fey'
    ) {
      for (const p of players) {
        if (
          p.name === 'Minion of Mordred' ||
          p.name === 'Morgan le Fey' ||
          p.name === 'Blind Hunter'
        ) {
          visible.add(p.id);
        }
      }
    }
    return visible;
  }, [players, perspectivePlayer]);

  const playerIdentity = useCallback(
    (p: Player): { role: string; alignmentHint: string | null } => {
      if (perspectivePlayerId === 'moderator') {
        return { role: p.name, alignmentHint: null };
      }
      if (visibleRoleIds.has(p.id)) {
        return { role: p.name, alignmentHint: null };
      }
      if (perspectivePlayer?.name === 'Cleric' && firstLeaderId === p.id) {
        return { role: 'Unknown role', alignmentHint: p.alignment };
      }
      return { role: 'Unknown role', alignmentHint: null };
    },
    [perspectivePlayerId, visibleRoleIds, perspectivePlayer, firstLeaderId],
  );

  return (
    <>
      <GameSetupPanel
        config={config}
        players={players}
        playerCount={playerCount}
        goodRoles={goodRoles}
        evilRoles={evilRoles}
        setPlayerCount={setPlayerCount}
        setGoodRoles={setGoodRoles}
        setEvilRoles={setEvilRoles}
        onStartGameClick={startGame}
        onResetToSetupClick={resetToSetup}
      />

      {players && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <PerspectivePanel
              perspectivePlayerId={perspectivePlayerId}
              players={players}
              perspectivePlayer={perspectivePlayer}
              onPlayerPerspectiveChange={setPerspectivePlayerId}
            />
            <RosterPanel
              players={players.map((p) => {
                const identity = playerIdentity(p);
                return {
                  id: p.id,
                  label: p.label,
                  roleLabel: identity.alignmentHint
                    ? `${identity.role} (${identity.alignmentHint})`
                    : identity.role,
                };
              })}
            />
            <TeamSelectionPanel
              missionIndex={missionIndex}
              missionHistory={missionHistory}
              missionSubPhase={missionSubPhase}
              teamSize={teamSize}
              failsRequired={failsRequired}
              leaderPlayer={leaderPlayer}
              teamIds={teamIds}
              currentLeaderId={currentLeaderId}
              players={players}
              votes={votes}
              getPlayerIdentity={playerIdentity}
              toggleTeamMember={toggleTeamMember}
              onTeamConfirmClick={confirmTeam}
              onResolveMissionClick={resolveMission}
              onNextMissionClick={advanceMission}
            />
          </div>
          <MissionHistoryPanel
            missionHistory={missionHistory}
            players={players}
            getPlayerIdentity={playerIdentity}
          />
        </div>
      )}
    </>
  );
}
