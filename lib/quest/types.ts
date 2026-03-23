export type MissionHistoryEntry = {
  mission: number;
  passed: boolean;
  failCount: number;
  successCount: number;
  failsRequired: number;
  leader: { id: string; label: string; name: string } | null;
  tokenRecipient: { id: string; label: string; name: string } | null;
  team: { id: string; label: string; name: string; card: 'success' | 'fail' }[];
};
