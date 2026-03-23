import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { Player } from '@/lib/quest/constants';

interface PerspectivePanelProps {
  perspectivePlayerId: string;
  players: Player[];
  perspectivePlayer: Player | null;
  onPlayerPerspectiveChange: (perspectivePlayerId: string) => void;
}

export default function PerspectivePanel({
  perspectivePlayerId,
  players,
  perspectivePlayer,
  onPlayerPerspectiveChange,
}: PerspectivePanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Perspective</CardTitle>
        <CardDescription>Choose whose information to display.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={perspectivePlayerId} onValueChange={onPlayerPerspectiveChange}>
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
  );
}
