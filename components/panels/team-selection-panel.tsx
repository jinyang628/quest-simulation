'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import type { MissionSubPhase, Player } from '@/lib/quest/constants';
import { MissionHistoryEntry } from '@/lib/quest/types';
import { isGoodRole } from '@/lib/quest/utils';

interface TeamSelectionPanelProps {
  missionIndex: number;
  missionHistory: MissionHistoryEntry[];
  missionSubPhase: MissionSubPhase;
  teamSize: number;
  failsRequired: number;
  leaderPlayer: Player | null;
  teamIds: Set<string>;
  currentLeaderId: string | null;
  players: Player[];
  votes: Record<string, 'success' | 'fail'>;
  getPlayerIdentity: (player: Player) => { role: string; alignmentHint: string | null };
  toggleTeamMember: (id: string, checked: boolean) => void;
  onTeamConfirmClick: () => void;
  onResolveMissionClick: () => void;
  onNextMissionClick: () => void;
}

export default function TeamSelectionPanel({
  missionIndex,
  missionHistory,
  missionSubPhase,
  teamSize,
  failsRequired,
  leaderPlayer,
  teamIds,
  currentLeaderId,
  players,
  votes,
  getPlayerIdentity,
  toggleTeamMember,
  onTeamConfirmClick,
  onResolveMissionClick,
  onNextMissionClick,
}: TeamSelectionPanelProps) {
  return (
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
                const identity = getPlayerIdentity(leaderPlayer);
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
                          const identity = getPlayerIdentity(p);
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
            <Button onClick={onTeamConfirmClick} disabled={teamIds.size !== teamSize}>
              Confirm team
            </Button>
          </div>
        )}

        {missionSubPhase === 'play' && (
          <div className="space-y-4">
            <Label>Mission cards</Label>
            <p className="text-muted-foreground text-xs">
              Loyal players always play success. Evil cards are simulated: on a 1-fail mission, the
              only evil on the team always fails; with more evil, each has a 50% chance to fail. On
              a 2-fail mission, if exactly two evil are on the team they always fail; otherwise evil
              always play success.
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
                          const identity = getPlayerIdentity(p);
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
            <Button onClick={onResolveMissionClick}>Reveal mission result</Button>
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
              <Button onClick={onNextMissionClick}>Next mission</Button>
            ) : (
              <p className="text-muted-foreground text-sm">
                Five missions complete. Reset or adjust setup to play again.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
