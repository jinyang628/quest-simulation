import { z } from 'zod';

export const alignment = z.enum(['good', 'evil']);

export type Alignment = z.infer<typeof alignment>;

export const PLAYER_CONFIG: Record<
  5 | 6 | 7 | 8 | 9 | 10,
  {
    good: number;
    evil: number;
    missionTeamSizes: [number, number, number, number, number];
    failsRequired: [number, number, number, number, number];
  }
> = {
  5: {
    good: 2,
    evil: 3,
    missionTeamSizes: [3, 2, 3, 4, 3],
    failsRequired: [1, 1, 1, 2, 1],
  },
  6: {
    good: 3,
    evil: 3,
    missionTeamSizes: [3, 2, 3, 4, 3],
    failsRequired: [1, 1, 1, 2, 1],
  },
  7: {
    good: 3,
    evil: 4,
    missionTeamSizes: [3, 2, 3, 4, 3],
    failsRequired: [1, 1, 1, 2, 1],
  },
  8: {
    good: 4,
    evil: 4,
    missionTeamSizes: [4, 3, 4, 5, 4],
    failsRequired: [1, 1, 2, 2, 1],
  },
  9: {
    good: 4,
    evil: 5,
    missionTeamSizes: [4, 3, 4, 5, 4],
    failsRequired: [1, 1, 2, 2, 1],
  },
  10: {
    good: 5,
    evil: 5,
    missionTeamSizes: [4, 3, 4, 5, 4],
    failsRequired: [1, 1, 2, 2, 1],
  },
};

export const ROLE_CATALOG = [
  { name: 'Loyal Servant', alignment: alignment.enum.good },
  { name: 'Cleric', alignment: alignment.enum.good },
  { name: 'Youth', alignment: alignment.enum.good },
  { name: 'Duke', alignment: alignment.enum.good },
  { name: 'Minion of Mordred', alignment: alignment.enum.evil },
  { name: 'Morgan le Fey', alignment: alignment.enum.evil },
  { name: 'Blind Hunter', alignment: alignment.enum.evil },
] as const;

type CatalogEntry = (typeof ROLE_CATALOG)[number];

export type RoleName = CatalogEntry['name'];
export type GoodRoleName = Extract<CatalogEntry, { alignment: typeof alignment.enum.good }>['name'];
export type EvilRoleName = Extract<CatalogEntry, { alignment: typeof alignment.enum.evil }>['name'];

export const GOOD_ROLE_OPTIONS: GoodRoleName[] = ROLE_CATALOG.filter(
  (e): e is Extract<CatalogEntry, { alignment: typeof alignment.enum.good }> =>
    e.alignment === alignment.enum.good,
).map((e) => e.name);

export const EVIL_ROLE_OPTIONS: EvilRoleName[] = ROLE_CATALOG.filter(
  (e): e is Extract<CatalogEntry, { alignment: typeof alignment.enum.evil }> =>
    e.alignment === alignment.enum.evil,
).map((e) => e.name);

export type Player = {
  id: string;
  label: string;
  name: RoleName;
  alignment: Alignment;
};

export type MissionSubPhase = 'propose' | 'play' | 'result';
