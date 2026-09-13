import { Participant, Group, GroupingRecommendation } from '../types';

/**
 * Validates whether participant count N can be partitioned into groups where:
 * 5 <= groupSize <= 7 for all groups, minimizing variance and preferring 5 or 6.
 */
export function calculateGroupingRecommendation(n: number): GroupingRecommendation {
  if (n < 5) {
    return {
      possible: false,
      participantCount: n,
      groupCount: 0,
      groupSizes: [],
      reason: `Not enough participants (${n}). A minimum of 5 participants is required to form a valid team.`
    };
  }

  // Check possible group count k:
  // For each k: ceil(n/k) <= 7 and floor(n/k) >= 5
  // min k: ceil(n/7)
  // max k: floor(n/5)
  const minK = Math.ceil(n / 7);
  const maxK = Math.floor(n / 5);

  if (minK > maxK) {
    return {
      possible: false,
      participantCount: n,
      groupCount: 0,
      groupSizes: [],
      reason: `Cannot partition ${n} students into teams where every team has between 5 and 7 members.`
    };
  }

  // Choose the best k that keeps average size closest to 5.5 - 6 (preferred 5-6)
  let bestK = minK;
  let bestScore = Infinity;

  for (let k = minK; k <= maxK; k++) {
    const avg = n / k;
    const score = Math.abs(avg - 5.8);
    if (score < bestScore) {
      bestScore = score;
      bestK = k;
    }
  }

  // Distribute n items into bestK buckets as evenly as possible
  const base = Math.floor(n / bestK);
  const remainder = n % bestK;
  const sizes: number[] = [];
  for (let i = 0; i < bestK; i++) {
    sizes.push(i < remainder ? base + 1 : base);
  }

  return {
    possible: true,
    participantCount: n,
    groupCount: bestK,
    groupSizes: sizes
  };
}

/**
 * Partitions participants into groups, ensuring:
 * 1. Strict 5-7 members per group
 * 2. Balanced departments across teams
 * 3. STRICTLY numbered teams: "TEAM 1", "TEAM 2", "TEAM 3", etc.
 */
export function generateBalancedGroups(sessionId: string, participants: Participant[]): Group[] {
  const recommendation = calculateGroupingRecommendation(participants.length);
  if (!recommendation.possible) {
    throw new Error(recommendation.reason || 'Invalid participant count for grouping');
  }

  const { groupCount, groupSizes } = recommendation;

  // Group participants by department for diversity
  const deptMap: Record<string, Participant[]> = {};
  participants.forEach(p => {
    const dept = p.department || 'OTHER';
    if (!deptMap[dept]) deptMap[dept] = [];
    deptMap[dept].push(p);
  });

  // Shuffle within each department
  Object.values(deptMap).forEach(list => list.sort(() => Math.random() - 0.5));

  // Interleave participants into a single diversified stream
  const diversifiedList: Participant[] = [];
  let deptKeys = Object.keys(deptMap);
  let deptIdx = 0;

  while (diversifiedList.length < participants.length) {
    const dept = deptKeys[deptIdx % deptKeys.length];
    if (deptMap[dept] && deptMap[dept].length > 0) {
      diversifiedList.push(deptMap[dept].pop()!);
    }
    deptIdx++;
  }

  // Build numbered groups strictly: TEAM 1, TEAM 2, TEAM 3, etc.
  const groups: Group[] = [];
  let currentIdx = 0;

  for (let i = 0; i < groupCount; i++) {
    const size = groupSizes[i];
    const members = diversifiedList.slice(currentIdx, currentIdx + size);
    currentIdx += size;

    const groupNum = i + 1;

    groups.push({
      id: `grp_${sessionId}_${groupNum}_${Date.now()}`,
      session_id: sessionId,
      group_number: groupNum,
      group_name: `TEAM ${groupNum}`,
      members: members.map(m => ({ ...m, group_id: `grp_${sessionId}_${groupNum}` })),
      product: null
    });
  }

  return groups;
}
