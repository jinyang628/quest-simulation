'use client';

import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { EvilRoleName, GoodRoleName, PLAYER_COUNTS, Player } from '@/lib/quest/constants';

interface GameSetupPanelProps {
  config: {
    good: number;
    evil: number;
    missionTeamSizes: [number, number, number, number, number];
    failsRequired: [number, number, number, number, number];
  };
  players: Player[] | null;
  playerCount: number;
  goodRoles: GoodRoleName[];
  evilRoles: EvilRoleName[];
  setPlayerCount: (playerCount: (typeof PLAYER_COUNTS)[number]) => void;
  setGoodRoles: Dispatch<SetStateAction<GoodRoleName[]>>;
  setEvilRoles: Dispatch<SetStateAction<EvilRoleName[]>>;
  onStartGameClick: () => void;
  onResetToSetupClick: () => void;
}

export default function GameSetupPanel({
  config,
  players,
  playerCount,
  goodRoles,
  evilRoles,
  setPlayerCount,
  setGoodRoles,
  setEvilRoles,
  onStartGameClick,
  onResetToSetupClick,
}: GameSetupPanelProps) {
  return (
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
                      setEvilRoles((prev: EvilRoleName[]) => {
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
          <Button onClick={onStartGameClick}>Start game</Button>
        ) : (
          <Button variant="outline" onClick={onResetToSetupClick}>
            Back to setup
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
