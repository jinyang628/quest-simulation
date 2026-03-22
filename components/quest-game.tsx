"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PLAYER_CONFIG } from "@/lib/quest/constants";
import { EVIL_ROLE_OPTIONS, GOOD_ROLE_OPTIONS } from "@/lib/quest/constants";
import type {
  EvilRoleName,
  GoodRoleName,
  MissionSubPhase,
  Player,
} from "@/lib/quest/constants";
import {
  alignmentForRole,
  isGoodRole,
  pickLeaderForMission,
  shuffle,
} from "@/lib/quest/utils";

const PLAYER_COUNTS = [5, 6, 7, 8, 9, 10] as const;

export function QuestGame() {
  const [playerCount, setPlayerCount] =
    useState<(typeof PLAYER_COUNTS)[number]>(6);
  const config = PLAYER_CONFIG[playerCount];

  const [goodRoles, setGoodRoles] = useState<GoodRoleName[]>(() =>
    Array.from({ length: PLAYER_CONFIG[6].good }, () => "Loyal Servant"),
  );
  const [evilRoles, setEvilRoles] = useState<EvilRoleName[]>(() =>
    Array.from({ length: PLAYER_CONFIG[6].evil }, () => "Minion of Mordred"),
  );

  const [players, setPlayers] = useState<Player[] | null>(null);
  const [missionIndex, setMissionIndex] = useState(0);
  const [leadersThisCycle, setLeadersThisCycle] = useState<Set<string>>(
    () => new Set(),
  );
  const [currentLeaderId, setCurrentLeaderId] = useState<string | null>(null);
  const [missionSubPhase, setMissionSubPhase] =
    useState<MissionSubPhase>("propose");
  const [teamIds, setTeamIds] = useState<Set<string>>(() => new Set());
  const [votes, setVotes] = useState<Record<string, "success" | "fail">>({});
  const [missionResults, setMissionResults] = useState<
    { mission: number; passed: boolean; failCount: number }[]
  >([]);

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
    setMissionResults([]);
    const { leader, nextCycle } = pickLeaderForMission(
      next.map((p) => p.id),
      new Set(),
    );
    setLeadersThisCycle(nextCycle);
    setCurrentLeaderId(leader);
    setMissionSubPhase("propose");
    setTeamIds(new Set());
    setVotes({});
  }, [goodRoles, evilRoles]);

  const resetToSetup = useCallback(() => {
    setPlayers(null);
    setMissionIndex(0);
    setLeadersThisCycle(new Set());
    setCurrentLeaderId(null);
    setMissionSubPhase("propose");
    setTeamIds(new Set());
    setVotes({});
    setMissionResults([]);
  }, []);

  const toggleTeamMember = useCallback(
    (id: string, checked: boolean) => {
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
    [teamSize],
  );

  const confirmTeam = useCallback(() => {
    if (teamIds.size !== teamSize || !players) return;
    const initial: Record<string, "success" | "fail"> = {};
    for (const id of teamIds) {
      const p = players.find((x) => x.id === id);
      if (p && isGoodRole(p.name)) {
        initial[id] = "success";
      } else {
        initial[id] = "success";
      }
    }
    setVotes(initial);
    setMissionSubPhase("play");
  }, [teamIds, teamSize, players]);

  const resolveMission = useCallback(() => {
    if (!players) return;
    let failCount = 0;
    for (const id of teamIds) {
      if (votes[id] === "fail") failCount += 1;
    }
    const passed = failCount < failsRequired;
    setMissionResults((r) => [
      ...r,
      { mission: missionIndex + 1, passed, failCount },
    ]);
    setMissionSubPhase("result");
  }, [players, teamIds, votes, failsRequired, missionIndex]);

  const advanceMission = useCallback(() => {
    if (!players) return;
    if (missionIndex >= 4) return;
    const { leader, nextCycle } = pickLeaderForMission(
      players.map((p) => p.id),
      leadersThisCycle,
    );
    setMissionIndex((m) => m + 1);
    setMissionSubPhase("propose");
    setTeamIds(new Set());
    setVotes({});
    setCurrentLeaderId(leader);
    setLeadersThisCycle(nextCycle);
  }, [players, missionIndex, leadersThisCycle]);

  const leaderPlayer = useMemo(
    () => players?.find((p) => p.id === currentLeaderId) ?? null,
    [players, currentLeaderId],
  );

  const setupValid =
    goodRoles.length === config.good && evilRoles.length === config.evil;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Quest simulation
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure roles, then run missions: each round a leader is picked at
          random (no repeat until everyone has led once). Good roles always play
          success; evil players may play success or fail.
        </p>
      </header>

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
                setGoodRoles(
                  Array.from({ length: good }, () => "Loyal Servant"),
                );
                setEvilRoles(
                  Array.from({ length: evil }, () => "Minion of Mordred"),
                );
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
                    <span className="text-muted-foreground w-10 text-xs">
                      #{i + 1}
                    </span>
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
                    <span className="text-muted-foreground w-10 text-xs">
                      #{i + 1}
                    </span>
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
        <>
          <Card>
            <CardHeader>
              <CardTitle>Roster</CardTitle>
              <CardDescription>
                Roles after random shuffle (for simulation / moderator view).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {players.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/80 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{p.label}</span>
                    <span className="text-muted-foreground">{p.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mission {missionIndex + 1} of 5</CardTitle>
              <CardDescription>
                Team size: {teamSize}. Fails required to sabotage:{" "}
                {failsRequired}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {leaderPlayer && (
                <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Leader: </span>
                  <span className="font-medium">{leaderPlayer.label}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    ({leaderPlayer.name})
                  </span>
                </div>
              )}

              {missionSubPhase === "propose" && (
                <div className="space-y-3">
                  <Label>
                    Select exactly {teamSize} player
                    {teamSize === 1 ? "" : "s"} for the mission
                  </Label>
                  <div className="flex flex-col gap-2">
                    {players.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-lg border border-transparent px-1 py-0.5 has-data-[state=checked]:border-border"
                      >
                        <Checkbox
                          id={`team-${p.id}`}
                          checked={teamIds.has(p.id)}
                          onCheckedChange={(c) =>
                            toggleTeamMember(p.id, c === true)
                          }
                        />
                        <label
                          htmlFor={`team-${p.id}`}
                          className="flex flex-1 cursor-pointer items-center justify-between gap-2 text-sm"
                        >
                          <span>{p.label}</span>
                          <span className="text-muted-foreground">
                            {p.name}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Selected: {teamIds.size} / {teamSize}
                  </p>
                  <Button
                    onClick={confirmTeam}
                    disabled={teamIds.size !== teamSize}
                  >
                    Confirm team
                  </Button>
                </div>
              )}

              {missionSubPhase === "play" && (
                <div className="space-y-4">
                  <Label>Mission cards</Label>
                  <p className="text-muted-foreground text-xs">
                    Loyal players must play success. Evil players may choose
                    success or fail.
                  </p>
                  <ul className="flex flex-col gap-4">
                    {[...teamIds].map((id) => {
                      const p = players.find((x) => x.id === id);
                      if (!p) return null;
                      const good = isGoodRole(p.name);
                      return (
                        <li
                          key={id}
                          className="flex flex-col gap-2 rounded-lg border border-border/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="font-medium">{p.label}</div>
                            <div className="text-muted-foreground text-xs">
                              {p.name}
                            </div>
                          </div>
                          {good ? (
                            <Badge variant="secondary">Success (forced)</Badge>
                          ) : (
                            <ToggleGroup
                              type="single"
                              variant="outline"
                              spacing={0}
                              value={votes[id] ?? "success"}
                              onValueChange={(v) => {
                                if (!v) return;
                                setVotes((prev) => ({
                                  ...prev,
                                  [id]: v as "success" | "fail",
                                }));
                              }}
                            >
                              <ToggleGroupItem value="success">
                                Success
                              </ToggleGroupItem>
                              <ToggleGroupItem
                                value="fail"
                                className="text-destructive"
                              >
                                Fail
                              </ToggleGroupItem>
                            </ToggleGroup>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <Button onClick={resolveMission}>
                    Reveal mission result
                  </Button>
                </div>
              )}

              {missionSubPhase === "result" && (
                <div className="space-y-4">
                  {(() => {
                    const last = missionResults[missionResults.length - 1];
                    if (!last) return null;
                    return (
                      <div
                        className={
                          last.passed
                            ? "rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
                            : "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3"
                        }
                      >
                        <p className="font-medium">
                          {last.passed ? "Mission succeeded" : "Mission failed"}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Fail cards played: {last.failCount} (need{" "}
                          {failsRequired} to fail)
                        </p>
                      </div>
                    );
                  })()}
                  {missionIndex < 4 ? (
                    <Button onClick={advanceMission}>Next mission</Button>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Five missions complete. Reset or adjust setup to play
                      again.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {missionResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Log</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-inside list-decimal space-y-1 text-sm">
                  {missionResults.map((r, i) => (
                    <li key={i}>
                      Mission {r.mission}:{" "}
                      {r.passed ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          success
                        </span>
                      ) : (
                        <span className="text-destructive">failed</span>
                      )}{" "}
                      ({r.failCount} fail{r.failCount === 1 ? "" : "s"})
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
