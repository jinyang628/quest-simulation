'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RosterProps {
  players: { id: string; label: string; roleLabel: string }[];
}

export default function Roster({ players }: RosterProps) {
  return (
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
              className="border-border/80 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <span className="font-medium">{p.label}</span>
              <span className="text-muted-foreground">{p.roleLabel}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
