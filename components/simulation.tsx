'use client';

import { useCallback, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { PLAYER_CONFIG } from '@/lib/quest/constants';
import { EVIL_ROLE_OPTIONS, GOOD_ROLE_OPTIONS } from '@/lib/quest/constants';
import type { EvilRoleName, GoodRoleName, MissionSubPhase, Player } from '@/lib/quest/constants';
import {
  alignmentForRole,
  countEvilOnMissionTeam,
  isGoodRole,
  pickLeaderForMission,
  shuffle,
  simulatedEvilMissionVote,
} from '@/lib/quest/utils';

import Roster from './roster';

const PLAYER_COUNTS = [5, 6, 7, 8, 9, 10] as const;

type MissionHistoryEntry = {
  mission: number;
  passed: boolean;
  failCount: number;
  successCount: number;
  failsRequired: number;
  leader: { id: string; label: string; name: string } | null;
  team: { id: string; label: string; name: string; card: 'success' | 'fail' }[];
};

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

  const setupValid = goodRoles.length === config.good && evilRoles.length === config.evil;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
          <CardDescription>
            {config.good} good · {config.evil} evil
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label>Player count</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={String(playerCount)}
              onValueChange={(v) => {
                if (!v) return;
                const n = Number(v) as (typeof PLAYER_COUNTS)[number];
                setPlayerCount(n);
                const { good, evil } = PLAYER_CONFIG[n];
                setGoodRoles(Array.from({ length: good }, () => 'Loyal Servant'));
                setEvilRoles(Array.from({ length: evil }, () => 'Minion of Mordred'));
              }}
              disabled={players !== null}
            >
              {PLAYER_COUNTS.map((n) => (
                <ToggleGroupItem key={n} value={String(n)}>
                  {n}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <Separator />

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-base">Good team roles</Label>
              <div className="flex flex-col gap-2">
                {goodRoles.map((role, i) => (
                  <div key={`g-${i}`} className="flex items-center gap-2">
                    <span className="text-muted-foreground w-10 text-xs">#{i + 1}</span>
                    <Select
                      value={role}
                      onValueChange={(v) => {
                        setGoodRoles((prev) => {
                          const next = [...prev];
                          next[i] = v as GoodRoleName;
                          return next;
                        });
                      }}
                      disabled={players !== null}
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GOOD_ROLE_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Evil team roles</Label>
              <div className="flex flex-col gap-2">
                {evilRoles.map((role, i) => (
                  <div key={`e-${i}`} className="flex items-center gap-2">
                    <span className="text-muted-foreground w-10 text-xs">#{i + 1}</span>
                    <Select
                      value={role}
                      onValueChange={(v) => {
                        setEvilRoles((prev) => {
                          const next = [...prev];
                          next[i] = v as EvilRoleName;
                          return next;
                        });
                      }}
                      disabled={players !== null}
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVIL_ROLE_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {players === null ? (
            <Button onClick={startGame} disabled={!setupValid}>
              Start game
            </Button>
          ) : (
            <Button variant="outline" onClick={resetToSetup}>
              Back to setup
            </Button>
          )}
        </CardFooter>
      </Card>

      {players && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Perspective</CardTitle>
                <CardDescription>Choose whose information to display.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={perspectivePlayerId} onValueChange={setPerspectivePlayerId}>
                  <SelectTrigger className="w-full sm:max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moderator">Moderator (all roles visible)</SelectItem>
                    {players.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {perspectivePlayer ? (
                  <p className="text-muted-foreground text-xs">
                    Viewing as {perspectivePlayer.label} ({perspectivePlayer.name})
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">Viewing as moderator.</p>
                )}
              </CardContent>
            </Card>
            <Roster
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
            <Card>
              <CardHeader>
                <CardTitle>Mission {missionIndex + 1} of 5</CardTitle>
                <CardDescription>
                  Team size: {teamSize}. Fails required to sabotage: {failsRequired}.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {leaderPlayer && (
                  <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Leader: </span>
                    <span className="font-medium">{leaderPlayer.label}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      (
                      {(() => {
                        const identity = playerIdentity(leaderPlayer);
                        return identity.alignmentHint
                          ? `${identity.role} (${identity.alignmentHint})`
                          : identity.role;
                      })()}
                      )
                    </span>
                  </div>
                )}

                {missionSubPhase === 'propose' && (
                  <div className="space-y-3">
                    <Label>
                      {teamSize === 1 ? (
                        <>The leader is the only player on this mission.</>
                      ) : (
                        <>
                          The leader is always on the mission. Select {teamSize - 1} other player
                          {teamSize - 1 === 1 ? '' : 's'}.
                        </>
                      )}
                    </Label>
                    <div className="flex flex-col gap-2">
                      {players.map((p) => {
                        const isLeader = p.id === currentLeaderId;
                        return (
                          <div
                            key={p.id}
                            className="has-data-[state=checked]:border-border flex items-center gap-3 rounded-lg border border-transparent px-1 py-0.5"
                          >
                            <Checkbox
                              id={`team-${p.id}`}
                              checked={teamIds.has(p.id)}
                              disabled={isLeader}
                              onCheckedChange={(c) => toggleTeamMember(p.id, c === true)}
                            />
                            <label
                              htmlFor={`team-${p.id}`}
                              className="flex flex-1 cursor-pointer items-center justify-between gap-2 text-sm"
                            >
                              <span>
                                {p.label}
                                {isLeader ? (
                                  <span className="text-muted-foreground ml-1 font-normal">
                                    (leader, always on team)
                                  </span>
                                ) : null}
                              </span>
                              <span className="text-muted-foreground">
                                {(() => {
                                  const identity = playerIdentity(p);
                                  return identity.alignmentHint
                                    ? `${identity.role} (${identity.alignmentHint})`
                                    : identity.role;
                                })()}
                              </span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Selected: {teamIds.size} / {teamSize} (leader included)
                    </p>
                    <Button onClick={confirmTeam} disabled={teamIds.size !== teamSize}>
                      Confirm team
                    </Button>
                  </div>
                )}

                {missionSubPhase === 'play' && (
                  <div className="space-y-4">
                    <Label>Mission cards</Label>
                    <p className="text-muted-foreground text-xs">
                      Loyal players always play success. Evil cards are simulated: on a 1-fail
                      mission, the only evil on the team always fails; with more evil, each has a
                      50% chance to fail. On a 2-fail mission, if exactly two evil are on the team
                      they always fail; otherwise evil always play success.
                    </p>
                    <ul className="flex flex-col gap-4">
                      {[...teamIds].map((id) => {
                        const p = players.find((x) => x.id === id);
                        if (!p) return null;
                        const good = isGoodRole(p.name);
                        return (
                          <li
                            key={id}
                            className="border-border/80 flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <div className="font-medium">{p.label}</div>
                              <div className="text-muted-foreground text-xs">
                                {(() => {
                                  const identity = playerIdentity(p);
                                  return identity.alignmentHint
                                    ? `${identity.role} (${identity.alignmentHint})`
                                    : identity.role;
                                })()}
                              </div>
                            </div>
                            {good ? (
                              <Badge variant="secondary">Success (forced)</Badge>
                            ) : votes[id] === 'fail' ? (
                              <Badge variant="destructive">Fail (simulated)</Badge>
                            ) : (
                              <Badge variant="secondary">Success (simulated)</Badge>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    <Button onClick={resolveMission}>Reveal mission result</Button>
                  </div>
                )}

                {missionSubPhase === 'result' && (
                  <div className="space-y-4">
                    {(() => {
                      const last = missionHistory[missionHistory.length - 1];
                      if (!last) return null;
                      return (
                        <div
                          className={
                            last.passed
                              ? 'rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3'
                              : 'border-destructive/30 bg-destructive/10 rounded-lg border px-4 py-3'
                          }
                        >
                          <p className="font-medium">
                            {last.passed ? 'Mission succeeded' : 'Mission failed'}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            Fail cards played: {last.failCount} (need {last.failsRequired} to fail)
                          </p>
                        </div>
                      );
                    })()}
                    {missionIndex < 4 ? (
                      <Button onClick={advanceMission}>Next mission</Button>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Five missions complete. Reset or adjust setup to play again.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-72 lg:self-start xl:w-80">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Mission history</CardTitle>
                <CardDescription className="text-xs">
                  Fills in as each mission is resolved.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {missionHistory.length === 0 ? (
                  <p className="text-muted-foreground py-2 text-sm">No missions completed yet.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {missionHistory.map((entry) => (
                      <li
                        key={entry.mission}
                        className="bg-muted/40 border-border/70 space-y-2 rounded-lg border p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-medium">Mission {entry.mission}</span>
                          {entry.passed ? (
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              Succeeded
                            </span>
                          ) : (
                            <span className="text-destructive text-xs font-medium">Failed</span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs leading-snug">
                          <span className="text-foreground/90">Leader: </span>
                          {entry.leader ? (
                            <>
                              {entry.leader.label}
                              <span className="text-muted-foreground">
                                {' '}
                                (
                                {(() => {
                                  const leader = players.find((p) => p.id === entry.leader?.id);
                                  if (!leader) return 'Unknown role';
                                  const identity = playerIdentity(leader);
                                  return identity.alignmentHint
                                    ? `${identity.role} (${identity.alignmentHint})`
                                    : identity.role;
                                })()}
                                )
                              </span>
                            </>
                          ) : (
                            '—'
                          )}
                        </p>
                        <p className="text-muted-foreground text-xs leading-snug">
                          {entry.successCount} success card{entry.successCount === 1 ? '' : 's'} ·{' '}
                          {entry.failCount} fail card{entry.failCount === 1 ? '' : 's'} · need{' '}
                          {entry.failsRequired} to sabotage
                        </p>
                        <ul className="border-border/50 space-y-1.5 border-t pt-2 text-xs">
                          {entry.team.map((m, i) => (
                            <li
                              key={`${entry.mission}-${i}`}
                              className="flex items-start justify-between gap-2"
                            >
                              <span className="min-w-0 leading-snug">
                                <span className="text-foreground font-medium">{m.label}</span>
                                <span className="text-muted-foreground">
                                  {' '}
                                  (
                                  {(() => {
                                    const member = players.find((p) => p.id === m.id);
                                    if (!member) return 'Unknown role';
                                    const identity = playerIdentity(member);
                                    return identity.alignmentHint
                                      ? `${identity.role} (${identity.alignmentHint})`
                                      : identity.role;
                                  })()}
                                  )
                                </span>
                              </span>
                              {m.card === 'fail' ? (
                                <Badge variant="destructive" className="shrink-0 text-[10px]">
                                  Fail
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="shrink-0 text-[10px]">
                                  Success
                                </Badge>
                              )}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </>
  );
}
