import { ROLE_CATALOG } from "./constants";
import type { Alignment, GoodRoleId, RoleId } from "./constants";

const GOOD_SET = new Set<GoodRoleId>(
  ROLE_CATALOG.filter((e) => e.alignment === "good").map((e) => e.id),
);

export function isGoodRole(role: RoleId): boolean {
  return GOOD_SET.has(role as GoodRoleId);
}

export function alignmentForRole(role: RoleId): Alignment {
  return isGoodRole(role) ? "good" : "evil";
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Picks a random leader among players who have not led in the current cycle.
 * When everyone has led once, the cycle resets. Returns the updated cycle
 * including the new leader.
 */
export function pickLeaderForMission(
  playerIds: string[],
  leadersThisCycle: Set<string>,
): { leader: string; nextCycle: Set<string> } {
  if (playerIds.length === 0) {
    throw new Error("No players");
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
