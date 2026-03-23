import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { MissionResult, MissionSubPhase, Player } from '@/lib/quest/constants';
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
  tokenRecipientId: string | null;
  tokenPlacementOptions: string[] | null;
  selectedTokenPlacementId: string | null;
  players: Player[];
  votes: Record<string, MissionResult>;
  getPlayerIdentity: (player: Player) => { role: string; alignmentHint: string | null };
  toggleTeamMember: (id: string, checked: boolean) => void;
  onTeamConfirmClick: () => void;
  onTokenPlacementSelectionChange: (tokenRecipientId: string) => void;
  onTokenPlacementConfirmClick: () => void;
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
  tokenRecipientId,
  tokenPlacementOptions,
  selectedTokenPlacementId,
  players,
  votes,
  getPlayerIdentity,
  toggleTeamMember,
  onTeamConfirmClick,
  onTokenPlacementSelectionChange,
  onTokenPlacementConfirmClick,
  onResolveMissionClick,
  onNextMissionClick,
}: TeamSelectionPanelProps) {
  const successCount = missionHistory.filter((m) => m.passed).length;
  const failCount = missionHistory.length - successCount;
  const goodGuysWon = successCount >= 3;
  const blindHunterHuntPhase = failCount >= 3;

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

        {missionSubPhase === 'token' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Place magic token</Label>
              <p className="text-muted-foreground text-xs">
                Choose who the mission leader places the magic token on.
              </p>
            </div>

            <Select
              value={selectedTokenPlacementId ?? undefined}
              onValueChange={(v) => onTokenPlacementSelectionChange(v)}
            >
              <SelectTrigger className="w-full sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...(tokenPlacementOptions ?? [])].map((id) => {
                  const p = players.find((x) => x.id === id);
                  if (!p) return null;
                  const identity = getPlayerIdentity(p);
                  const roleText = identity.alignmentHint
                    ? `${identity.role} (${identity.alignmentHint})`
                    : identity.role;
                  return (
                    <SelectItem key={id} value={id}>
                      {p.label} - {roleText}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Button onClick={onTokenPlacementConfirmClick} disabled={!selectedTokenPlacementId}>
              Confirm token placement
            </Button>
          </div>
        )}

        {missionSubPhase === 'play' && (
          <div className="space-y-4">
            <Label>Mission cards</Label>
            <ul className="flex flex-col gap-4">
              {[...teamIds].map((id) => {
                const p = players.find((x) => x.id === id);
                if (!p) return null;
                const good = isGoodRole(p.name);
                const isTokened = tokenRecipientId === id;

                const badge = (() => {
                  if (isTokened) {
                    const forcedCardBadge =
                      p.name === 'Youth' ? (
                        <Badge variant="destructive">Fail (forced)</Badge>
                      ) : p.name === 'Morgan le Fey' ? (
                        votes[id] === 'fail' ? (
                          <Badge variant="destructive">Fail (simulated)</Badge>
                        ) : (
                          <Badge variant="secondary">Success (simulated)</Badge>
                        )
                      ) : (
                        <Badge variant="secondary">Success (forced)</Badge>
                      );

                    return (
                      <div className="flex flex-col items-end gap-1">
                        {forcedCardBadge}
                        <Badge variant="outline">Tokened</Badge>
                      </div>
                    );
                  }

                  // Non-tokened behavior.
                  if (good) return <Badge variant="secondary">Success (forced)</Badge>;
                  return votes[id] === 'fail' ? (
                    <Badge variant="destructive">Fail (simulated)</Badge>
                  ) : (
                    <Badge variant="secondary">Success (simulated)</Badge>
                  );
                })();

                return (
                  <li
                    key={id}
                    className="border-border/80 flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        {p.label}
                        {isTokened ? <Badge variant="outline">Tokened</Badge> : null}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {(() => {
                          const identity = getPlayerIdentity(p);
                          return identity.alignmentHint
                            ? `${identity.role} (${identity.alignmentHint})`
                            : identity.role;
                        })()}
                      </div>
                    </div>
                    {badge}
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
            {goodGuysWon ? (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Good guys have won the game
              </p>
            ) : blindHunterHuntPhase ? (
              <p className="text-destructive text-sm font-medium">Blind hunter hunt phase</p>
            ) : missionIndex < 4 ? (
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
