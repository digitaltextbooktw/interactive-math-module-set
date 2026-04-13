// ═══ Level 6 全等判定幾何引擎 ═══

export interface Point {
  x: number;
  y: number;
}

export type Triangle = [Point, Point, Point];

export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function centroid(pts: Triangle): Point {
  return {
    x: (pts[0].x + pts[1].x + pts[2].x) / 3,
    y: (pts[0].y + pts[1].y + pts[2].y) / 3,
  };
}

export function rotatePoint(p: Point, center: Point, angle: number): Point {
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function reflectX(p: Point, center: Point): Point {
  return { x: 2 * center.x - p.x, y: p.y };
}

export function sortedSideLengths(pts: Triangle): [number, number, number] {
  const sides = [
    distance(pts[0], pts[1]),
    distance(pts[1], pts[2]),
    distance(pts[2], pts[0]),
  ];
  sides.sort((a, b) => a - b);
  return sides as [number, number, number];
}

export function sidesApproxEqual(a: Triangle, b: Triangle, tolerance = 8): boolean {
  const sa = sortedSideLengths(a);
  const sb = sortedSideLengths(b);
  return sa.every((v, i) => Math.abs(v - sb[i]) < tolerance);
}

export type OverlapStatus = 'far' | 'near' | 'close' | 'snapped';

export interface OverlapResult {
  status: OverlapStatus;
  centroidDist: number;
  maxVertexDist: number;
  pairs: [number, number][];
}

// Signed area of a triangle. Sign tells us orientation (CW vs CCW).
// Two triangles with opposite signs are mirror images of each other.
function signedArea(t: Triangle): number {
  return 0.5 * (
    (t[1].x - t[0].x) * (t[2].y - t[0].y)
    - (t[2].x - t[0].x) * (t[1].y - t[0].y)
  );
}

export function isSameOrientation(a: Triangle, b: Triangle): boolean {
  return Math.sign(signedArea(a)) === Math.sign(signedArea(b));
}

// Greedy match: pair each actual vertex with closest fixed vertex (1-to-1)
function greedyMatch(fixed: Triangle, actual: Triangle): [number, number][] {
  const dists: { fi: number; ai: number; d: number }[] = [];
  for (let ai = 0; ai < 3; ai++) {
    for (let fi = 0; fi < 3; fi++) {
      dists.push({ fi, ai, d: distance(fixed[fi], actual[ai]) });
    }
  }
  dists.sort((a, b) => a.d - b.d);
  const usedFixed = new Set<number>();
  const usedActual = new Set<number>();
  const pairs: [number, number][] = [];
  for (const { fi, ai } of dists) {
    if (usedFixed.has(fi) || usedActual.has(ai)) continue;
    pairs.push([fi, ai]);
    usedFixed.add(fi);
    usedActual.add(ai);
    if (pairs.length === 3) break;
  }
  return pairs;
}

export function checkOverlap(
  fixed: Triangle,
  actual: Triangle,
  isCongruent: boolean
): OverlapResult {
  const cFixed = centroid(fixed);
  const cActual = centroid(actual);
  const centroidDist = distance(cFixed, cActual);

  if (centroidDist > 100) {
    return { status: 'far', centroidDist, maxVertexDist: Infinity, pairs: [] };
  }

  const pairs = greedyMatch(fixed, actual);
  const maxVertexDist = Math.max(
    ...pairs.map(([fi, ai]) => distance(fixed[fi], actual[ai]))
  );

  // ── Hard rule: a mirrored triangle (opposite winding direction) is NEVER
  //    "close" or "snapped". The player must press the flip button first. ──
  const sameOrientation = isSameOrientation(fixed, actual);

  if (sameOrientation && maxVertexDist < 14 && isCongruent) {
    return { status: 'snapped', centroidDist, maxVertexDist, pairs };
  }
  if (sameOrientation && maxVertexDist < 26 && isCongruent) {
    return { status: 'close', centroidDist, maxVertexDist, pairs };
  }
  return { status: 'near', centroidDist, maxVertexDist, pairs };
}

// Compute the rotation needed to align actual to fixed using paired vertices
export function computeSnapRotation(
  fixed: Triangle,
  actual: Triangle,
  pairs: [number, number][]
): number {
  const cFixed = centroid(fixed);
  const cActual = centroid(actual);
  // Use first paired vertices to compute rotation difference
  const [fi0, ai0] = pairs[0];
  const angleFixed = Math.atan2(fixed[fi0].y - cFixed.y, fixed[fi0].x - cFixed.x);
  const angleActual = Math.atan2(actual[ai0].y - cActual.y, actual[ai0].x - cActual.x);
  let delta = angleFixed - angleActual;
  // Normalize to [-π, π]
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}
