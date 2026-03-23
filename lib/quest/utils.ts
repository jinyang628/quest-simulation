import {
  PROBABILITY_TO_DEVIATE_FROM_DOMINANT_STRATEGY,
  ROLE_CATALOG,
  alignment,
} from './constants';
import type { Alignment, Player, RoleName } from './constants';

const GOOD_SET = new Set<RoleName>(
  ROLE_CATALOG.filter((e) => e.alignment === alignment.enum.good).map((e) => e.name),
);

export function isGoodRole(role: RoleName): boolean {
  return GOOD_SET.has(role);
}

export function alignmentForRole(role: RoleName): Alignment {
  return isGoodRole(role) ? alignment.enum.good : alignment.enum.evil;
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function countEvilOnMissionTeam(teamIds: Iterable<string>, players: Player[]): number {
  let n = 0;
  for (const id of teamIds) {
    const p = players.find((x) => x.id === id);
    if (p && !isGoodRole(p.name)) n += 1;
  }
  return n;
}

/**
 * Simulated mission card for one evil player from their perspective (known evil on team).
 *
 * - 1 fail required: sole evil on team always fails; otherwise 50% fail.
 * - 2 fail required: exactly two evil on team always fail; otherwise always success.
 */
export function simulatedEvilMissionVote(
  failsRequired: number,
  evilCountOnTeam: number,
): 'success' | 'fail' {
  if (failsRequired === 1) {
    if (evilCountOnTeam === 1) return 'fail';
    return Math.random() < 0.5 ? 'fail' : 'success';
  }
  if (failsRequired === 2) {
    if (evilCountOnTeam === 2) return 'fail';
    return 'success';
  }
  return 'success';
}

export function pickLeaderForMission(
  playerIds: string[],
  leadersThisCycle: Set<string>,
): { leader: string; nextCycle: Set<string> } {
  if (playerIds.length === 0) {
    throw new Error('No players');
  }
  let cycle = new Set(leadersThisCycle);
  const notYet = playerIds.filter((id) => !cycle.has(id));
  const pool =
    notYet.length > 0
      ? notYet
      : (() => {
          cycle = new Set();
          return [...playerIds];
        })();
  const leader = pool[Math.floor(Math.random() * pool.length)];
  cycle.add(leader);
  return { leader, nextCycle: cycle };
}

export function pickTokenRecipientForMissionLeader({
  leaderId,
  teamIds,
  players,
  firstPlayerId,
}: {
  leaderId: string | null;
  teamIds: Set<string>;
  players: Player[];

  firstPlayerId?: string | null;
}): string {
  if (!leaderId) {
    throw new Error('No mission leader to place magic token');
  }

  const teamPlayers = players.filter((p) => teamIds.has(p.id));
  const leader = teamPlayers.find((p) => p.id === leaderId);
  if (!leader) {
    throw new Error('Leader must be on the mission team');
  }

  const otherIds = teamPlayers.filter((p) => p.id !== leaderId).map((p) => p.id);
  // If the leader is the only team member, the token has nowhere else to go.
  if (otherIds.length === 0) return leaderId;

  const pickOther = (): string => otherIds[Math.floor(Math.random() * otherIds.length)];

  switch (leader.name) {
    case 'Youth':
      return pickOther();
    case 'Loyal Servant': {
      return Math.random() < PROBABILITY_TO_DEVIATE_FROM_DOMINANT_STRATEGY ? leaderId : pickOther();
    }
    case 'Cleric': {
      // Cleric: will not token anyone he knows is good.

      // 10% chance to token himself.
      const chooseSelf = Math.random() < PROBABILITY_TO_DEVIATE_FROM_DOMINANT_STRATEGY;
      if (chooseSelf) return leaderId;

      // Otherwise choose "someone else", but exclude the known-good teammate (if any).
      let eligibleOtherIds = otherIds;
      if (firstPlayerId) {
        const knownPlayer = teamPlayers.find((p) => p.id === firstPlayerId);
        if (knownPlayer && isGoodRole(knownPlayer.name)) {
          eligibleOtherIds = otherIds.filter((id) => id !== firstPlayerId);
        }
      }

      // If all "someone else" options were excluded, fall back to himself to guard against accidental youth.
      if (eligibleOtherIds.length === 0) return leaderId;
      return eligibleOtherIds[Math.floor(Math.random() * eligibleOtherIds.length)];
    }
    default: {
      // Any evil role: always token someone else.
      if (!isGoodRole(leader.name)) {
        return pickOther();
      }
      // Any other good role: default to loyal-servant-like behavior.
      return Math.random() < PROBABILITY_TO_DEVIATE_FROM_DOMINANT_STRATEGY ? leaderId : pickOther();
    }
  }
}

export function getTokenRecipientOptionsForMissionLeader({
  leaderId,
  teamIds,
  players,
  firstPlayerId,
}: {
  leaderId: string | null;
  teamIds: Set<string>;
  players: Player[];
  firstPlayerId?: string | null;
}): string[] {
  if (!leaderId) {
    throw new Error('No mission leader to place magic token');
  }

  const teamPlayers = players.filter((p) => teamIds.has(p.id));
  const leader = teamPlayers.find((p) => p.id === leaderId);
  if (!leader) {
    throw new Error('Leader must be on the mission team');
  }

  const otherIds = teamPlayers.filter((p) => p.id !== leaderId).map((p) => p.id);

  // If the leader is the only team member, the token has nowhere else to go.
  if (otherIds.length === 0) return [leaderId];

  switch (leader.name) {
    case 'Youth':
      return [...otherIds];

    case 'Loyal Servant':
      // Loyal Servant normally token other, but can also token himself (deviation).
      return [leaderId, ...otherIds];

    case 'Cleric': {
      // Cleric: will not token anyone he knows is good.
      // He can also sometimes token himself (deviation).
      let eligibleOtherIds = otherIds;
      if (firstPlayerId) {
        const knownPlayer = teamPlayers.find((p) => p.id === firstPlayerId);
        if (knownPlayer && isGoodRole(knownPlayer.name)) {
          eligibleOtherIds = otherIds.filter((id) => id !== firstPlayerId);
        }
      }

      // If all "someone else" options were excluded, fall back to himself.
      if (eligibleOtherIds.length === 0) return [leaderId];

      return [leaderId, ...eligibleOtherIds];
    }

    default: {
      // Evil roles: always token someone else.
      if (!isGoodRole(leader.name)) {
        return [...otherIds];
      }

      // Any other good role: can token self or someone else (deviation).
      return [leaderId, ...otherIds];
    }
  }
}
