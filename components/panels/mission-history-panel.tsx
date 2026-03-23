import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type { Player } from '@/lib/quest/constants';
import { MissionHistoryEntry } from '@/lib/quest/types';

interface MissionHistoryPanelProps {
  missionHistory: MissionHistoryEntry[];
  players: Player[];
  getPlayerIdentity: (player: Player) => { role: string; alignmentHint: string | null };
}

export default function MissionHistoryPanel({
  missionHistory,
  players,
  getPlayerIdentity,
}: MissionHistoryPanelProps) {
  return (
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
                            const identity = getPlayerIdentity(leader);
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
                    <span className="text-foreground/90">Tokened: </span>
                    {entry.tokenRecipient ? (
                      <>
                        {entry.tokenRecipient.label}
                        <span className="text-muted-foreground">
                          {' '}
                          (
                          {(() => {
                            const tokenedPlayer = players.find(
                              (p) => p.id === entry.tokenRecipient?.id,
                            );
                            if (!tokenedPlayer) return 'Unknown role';
                            const identity = getPlayerIdentity(tokenedPlayer);
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
                              const identity = getPlayerIdentity(member);
                              return identity.alignmentHint
                                ? `${identity.role} (${identity.alignmentHint})`
                                : identity.role;
                            })()}
                            )
                          </span>
                        </span>
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
  );
}
