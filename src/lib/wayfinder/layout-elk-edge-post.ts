import type { ElkExtendedEdge, ElkNode, ElkPoint } from 'elkjs/lib/elk-api'
import type { Edge } from '@xyflow/svelte'
import { LAYOUT_NODE_H, LAYOUT_NODE_W } from './layout-node-post'
import type { TicketFlowNode } from './types'

/** Points for a custom polyline edge (flow coordinates, handle → bends → handle). */
export type ElkEdgeRouteData = {
	points: { x: number; y: number }[]
}

export type ObstacleBox = { id: string; x: number; y: number; w: number; h: number }

/** Sub-passes under `elkEdgePost`; ignored by callers when the master flag is false. */
export type ElkEdgePostOpts = {
	elkChannelMid: boolean
	elkClampDownward: boolean
	elkClearObstacles: boolean
	elkSeparateLanes: boolean
}

/** Unit-test / full-pass defaults; recipe path always sets lanes from `elkSeparateLanes`. */
export const ELK_EDGE_POST_ALL: ElkEdgePostOpts = {
	elkChannelMid: true,
	elkClampDownward: true,
	elkClearObstacles: true,
	elkSeparateLanes: true
}

type Pt = { x: number; y: number }

/** Inflate packed cards so remapped mid-channel X cannot graze borders. */
export const OBSTACLE_PAD = 8

/**
 * Remap ELK sections into flow space after node placement (and optional
 * packComponentsX), then optionally clamp TB-forward exits, detour through
 * cards, and split shared mid-channel horizontal lanes (per `opts`).
 */
export function applyElkEdgePost(
	edges: Edge[],
	elkEdges: ElkExtendedEdge[] | undefined,
	elkById: Map<string, ElkNode>,
	flowById: Map<string, TicketFlowNode>,
	opts: ElkEdgePostOpts = ELK_EDGE_POST_ALL
): Edge[] {
	const allObstacles: ObstacleBox[] = [...flowById.values()].map((n) => ({
		id: n.id,
		x: n.position.x,
		y: n.position.y,
		w: LAYOUT_NODE_W,
		h: LAYOUT_NODE_H
	}))

	type Built = {
		edge: Edge
		points: Pt[]
		sourceId: string
		targetId: string
		channelLo: number
		channelHi: number
	}

	const built: (Built | { edge: Edge; points: null })[] = edges.map((e) => {
		const elkEdge = elkEdges?.find((x) => x.id === e.id)
		const source = flowById.get(e.source)
		const target = flowById.get(e.target)
		const elkSource = elkById.get(e.source)
		const elkTarget = elkById.get(e.target)
		if (!elkEdge?.sections?.length || !source || !target || !elkSource || !elkTarget) {
			return { edge: { ...e, type: 'smoothstep' as const }, points: null }
		}

		const points = remapElkSection(
			elkEdge.sections[0]!,
			elkSource,
			elkTarget,
			source.position,
			target.position,
			opts
		)
		if (points.length < 2) {
			return { edge: { ...e, type: 'smoothstep' as const }, points: null }
		}

		const obstacles = allObstacles.filter((o) => o.id !== e.source && o.id !== e.target)
		const routed = opts.elkClearObstacles
			? clearOrthogonalObstacles(points, obstacles)
			: points
		const channelLo = Math.min(routed[0]!.y, routed.at(-1)!.y)
		const channelHi = Math.max(routed[0]!.y, routed.at(-1)!.y)

		return {
			edge: e,
			points: routed,
			sourceId: e.source,
			targetId: e.target,
			channelLo,
			channelHi
		}
	})

	const routes = built.filter((b): b is Built => b.points !== null)
	if (opts.elkSeparateLanes) separateSharedYHorizontalLanes(routes)

	if (opts.elkClearObstacles) {
		for (const r of routes) {
			const obstacles = allObstacles.filter((o) => o.id !== r.sourceId && o.id !== r.targetId)
			r.points = clearOrthogonalObstacles(r.points, obstacles)
		}
	}

	return built.map((b) => {
		if (b.points === null) return b.edge
		return {
			...b.edge,
			type: 'elk' as const,
			data: { points: b.points } satisfies ElkEdgeRouteData
		}
	})
}

/** Near-equality for stacked channel-mid horizontals (exact mid or tiny remap drift). */
const LANE_Y_EPS = 2

/**
 * When several edges' primary mid-channel H share nearly the same Y and overlapping X,
 * assign distinct Y lanes inside the shared tier channel (handles stay fixed).
 * One candidate per route — U-detour micro-H must not be re-laned.
 */
export function separateSharedYHorizontalLanes(
	routes: { points: Pt[]; channelLo: number; channelHi: number }[]
): void {
	type HSeg = {
		route: number
		seg: number
		y: number
		x0: number
		x1: number
		lo: number
		hi: number
	}

	const segs: HSeg[] = []
	for (let r = 0; r < routes.length; r++) {
		const route = routes[r]!
		const pts = route.points
		if (pts.length < 4) continue
		const lo = route.channelLo
		const hi = route.channelHi
		if (hi - lo < 1) continue
		const mid = (lo + hi) / 2

		let best: HSeg | null = null
		let bestScore = -Infinity
		for (let i = 1; i < pts.length - 2; i++) {
			const a = pts[i]!
			const b = pts[i + 1]!
			if (Math.abs(a.y - b.y) > 1e-6 || Math.abs(a.x - b.x) < 1e-6) continue
			// Skip H on card top/bottom borders.
			if (a.y <= lo + 1e-6 || a.y >= hi - 1e-6) continue
			const span = Math.abs(a.x - b.x)
			// Prefer long channel spans near mid (not short obstacle U-detours).
			const score = span - Math.abs(a.y - mid) * 0.25
			if (score > bestScore) {
				bestScore = score
				best = {
					route: r,
					seg: i,
					y: a.y,
					x0: Math.min(a.x, b.x),
					x1: Math.max(a.x, b.x),
					lo,
					hi
				}
			}
		}
		if (best) segs.push(best)
	}

	if (segs.length < 2) return

	const parent = segs.map((_, i) => i)
	const find = (i: number): number => {
		let p = i
		while (parent[p] !== p) p = parent[p]!
		let cur = i
		while (parent[cur] !== p) {
			const next = parent[cur]!
			parent[cur] = p
			cur = next
		}
		return p
	}
	const unite = (a: number, b: number) => {
		const pa = find(a)
		const pb = find(b)
		if (pa !== pb) parent[pa] = pb
	}

	for (let i = 0; i < segs.length; i++) {
		for (let j = i + 1; j < segs.length; j++) {
			const a = segs[i]!
			const b = segs[j]!
			if (Math.abs(a.y - b.y) > LANE_Y_EPS) continue
			if (a.x1 <= b.x0 || b.x1 <= a.x0) continue
			unite(i, j)
		}
	}

	const clusters = new Map<number, HSeg[]>()
	for (let i = 0; i < segs.length; i++) {
		const root = find(i)
		const list = clusters.get(root) ?? []
		list.push(segs[i]!)
		clusters.set(root, list)
	}

	// Inset from card borders so lanes stay in the open channel band.
	const inset = 4

	for (const cluster of clusters.values()) {
		if (cluster.length < 2) continue
		const lo = Math.max(...cluster.map((s) => s.lo)) + inset
		const hi = Math.min(...cluster.map((s) => s.hi)) - inset
		if (hi <= lo) continue

		const ordered = [...cluster].sort((a, b) => {
			const mx = (a.x0 + a.x1) / 2 - (b.x0 + b.x1) / 2
			if (Math.abs(mx) > 1e-6) return mx
			return a.route - b.route
		})

		const n = ordered.length
		for (let k = 0; k < n; k++) {
			const laneY = lo + ((k + 0.5) / n) * (hi - lo)
			const s = ordered[k]!
			const pts = routes[s.route]!.points
			pts[s.seg]!.y = laneY
			pts[s.seg + 1]!.y = laneY
		}
	}
}

/**
 * If an H/V segment pierces a node AABB (inflated), bend around via free channel X/Y.
 * Pack can slide cards into ELK mid-channel coordinates that remap never re-routes.
 */
export function clearOrthogonalObstacles(
	points: { x: number; y: number }[],
	obstacles: ObstacleBox[],
	pad = OBSTACLE_PAD
): { x: number; y: number }[] {
	if (points.length < 2 || obstacles.length === 0) return points
	let pts = points.map((p) => ({ ...p }))
	for (let iter = 0; iter < 12; iter++) {
		let changed = false
		const next: { x: number; y: number }[] = [{ ...pts[0]! }]
		for (let i = 1; i < pts.length; i++) {
			const a = next[next.length - 1]!
			const b = pts[i]!
			const hit = firstHitObstacle(a, b, obstacles, pad)
			if (!hit) {
				pushUnique(next, b)
				continue
			}
			const detour = detourAround(a, b, hit, obstacles, pad)
			for (const p of detour) pushUnique(next, p)
			changed = true
		}
		pts = next
		if (!changed) break
	}
	return pts
}

function pushUnique(out: Pt[], p: Pt): void {
	const prev = out[out.length - 1]
	if (prev && Math.abs(prev.x - p.x) < 1e-6 && Math.abs(prev.y - p.y) < 1e-6) return
	out.push({ ...p })
}

function inflate(box: ObstacleBox, pad: number) {
	return {
		L: box.x - pad,
		R: box.x + box.w + pad,
		T: box.y - pad,
		B: box.y + box.h + pad
	}
}

function firstHitObstacle(a: Pt, b: Pt, obstacles: ObstacleBox[], pad: number): ObstacleBox | null {
	for (const o of obstacles) {
		if (segmentHitsInflated(a, b, inflate(o, pad))) return o
	}
	return null
}

function segmentHitsInflated(
	a: Pt,
	b: Pt,
	box: { L: number; R: number; T: number; B: number }
): boolean {
	const eps = 1e-6
	if (Math.abs(a.x - b.x) < eps) {
		const x = a.x
		if (x <= box.L || x >= box.R) return false
		const y0 = Math.min(a.y, b.y)
		const y1 = Math.max(a.y, b.y)
		return y1 > box.T && y0 < box.B
	}
	if (Math.abs(a.y - b.y) < eps) {
		const y = a.y
		if (y <= box.T || y >= box.B) return false
		const x0 = Math.min(a.x, b.x)
		const x1 = Math.max(a.x, b.x)
		return x1 > box.L && x0 < box.R
	}
	return false
}

function detourAround(
	a: Pt,
	b: Pt,
	hit: ObstacleBox,
	obstacles: ObstacleBox[],
	pad: number
): Pt[] {
	const box = inflate(hit, pad)
	const eps = 1e-6
	if (Math.abs(a.x - b.x) < eps) {
		const x = a.x
		const y0 = a.y
		const y1 = b.y
		const yLo = Math.min(y0, y1)
		const yHi = Math.max(y0, y1)
		const turnLo = Math.max(yLo, box.T)
		const turnHi = Math.min(yHi, box.B)
		const freeX = nearestFreeX(x, turnLo, turnHi, obstacles, pad)
		if (y0 <= y1) {
			return [
				{ x, y: turnLo },
				{ x: freeX, y: turnLo },
				{ x: freeX, y: turnHi },
				{ x, y: turnHi },
				{ x, y: y1 }
			]
		}
		return [
			{ x, y: turnHi },
			{ x: freeX, y: turnHi },
			{ x: freeX, y: turnLo },
			{ x, y: turnLo },
			{ x, y: y1 }
		]
	}
	if (Math.abs(a.y - b.y) < eps) {
		const y = a.y
		const x0 = a.x
		const x1 = b.x
		const xLo = Math.min(x0, x1)
		const xHi = Math.max(x0, x1)
		const turnLo = Math.max(xLo, box.L)
		const turnHi = Math.min(xHi, box.R)
		const freeY = nearestFreeY(y, turnLo, turnHi, obstacles, pad)
		if (x0 <= x1) {
			return [
				{ x: turnLo, y },
				{ x: turnLo, y: freeY },
				{ x: turnHi, y: freeY },
				{ x: turnHi, y },
				{ x: x1, y }
			]
		}
		return [
			{ x: turnHi, y },
			{ x: turnHi, y: freeY },
			{ x: turnLo, y: freeY },
			{ x: turnLo, y },
			{ x: x1, y }
		]
	}
	return [b]
}

function nearestFreeX(
	preferred: number,
	y0: number,
	y1: number,
	obstacles: ObstacleBox[],
	pad: number
): number {
	const yLo = Math.min(y0, y1)
	const yHi = Math.max(y0, y1)
	const intervals: [number, number][] = []
	for (const o of obstacles) {
		const b = inflate(o, pad)
		if (b.B <= yLo || b.T >= yHi) continue
		intervals.push([b.L, b.R])
	}
	return nearestOutside(preferred, mergeIntervals(intervals))
}

function nearestFreeY(
	preferred: number,
	x0: number,
	x1: number,
	obstacles: ObstacleBox[],
	pad: number
): number {
	const xLo = Math.min(x0, x1)
	const xHi = Math.max(x0, x1)
	const intervals: [number, number][] = []
	for (const o of obstacles) {
		const b = inflate(o, pad)
		if (b.R <= xLo || b.L >= xHi) continue
		intervals.push([b.T, b.B])
	}
	return nearestOutside(preferred, mergeIntervals(intervals))
}

function mergeIntervals(intervals: [number, number][]): [number, number][] {
	if (intervals.length === 0) return []
	const sorted = [...intervals].sort((a, b) => a[0] - b[0])
	const out: [number, number][] = [sorted[0]!]
	for (let i = 1; i < sorted.length; i++) {
		const cur = sorted[i]!
		const last = out[out.length - 1]!
		if (cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1])
		else out.push([...cur])
	}
	return out
}

function nearestOutside(preferred: number, intervals: [number, number][]): number {
	if (!intervals.some(([L, R]) => preferred > L && preferred < R)) return preferred
	let best = preferred
	let bestDist = Infinity
	for (const [L, R] of intervals) {
		for (const c of [L, R]) {
			const d = Math.abs(c - preferred)
			if (d < bestDist) {
				bestDist = d
				best = c
			}
		}
	}
	return best
}

/**
 * Map one ELK edge section into flow coordinates after placement / pack.
 *
 * ELK ORTHOGONAL sections are axis-aligned; a per-index blend of pack Δx used to
 * shear vertical segments into diagonals. Instead: stretch Y, snap channel X by
 * equality with ELK endpoints (or keep middle-channel X), then enforce H/V.
 */
function remapElkSection(
	section: { startPoint: ElkPoint; endPoint: ElkPoint; bendPoints?: ElkPoint[] },
	elkSource: ElkNode,
	elkTarget: ElkNode,
	flowSource: { x: number; y: number },
	flowTarget: { x: number; y: number },
	opts: Pick<ElkEdgePostOpts, 'elkChannelMid' | 'elkClampDownward'>
): { x: number; y: number }[] {
	const elkStart = {
		x: (elkSource.x ?? 0) + LAYOUT_NODE_W / 2,
		y: (elkSource.y ?? 0) + LAYOUT_NODE_H
	}
	const elkEnd = {
		x: (elkTarget.x ?? 0) + LAYOUT_NODE_W / 2,
		y: elkTarget.y ?? 0
	}
	const flowStart = {
		x: flowSource.x + LAYOUT_NODE_W / 2,
		y: flowSource.y + LAYOUT_NODE_H
	}
	const flowEnd = {
		x: flowTarget.x + LAYOUT_NODE_W / 2,
		y: flowTarget.y
	}

	const raw = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint]
	if (raw.length < 2) return []

	const dyElk = elkEnd.y - elkStart.y
	const dyFlow = flowEnd.y - flowStart.y
	const eps = 1e-3

	const mapY = (p: ElkPoint, i: number): number => {
		if (Math.abs(dyElk) < 1e-6) {
			const t = raw.length <= 1 ? 0 : i / (raw.length - 1)
			return flowStart.y + dyFlow * t
		}
		return flowStart.y + ((p.y - elkStart.y) / dyElk) * dyFlow
	}

	const mapped = raw.map((p, i) => {
		if (i === 0) return { ...flowStart }
		if (i === raw.length - 1) return { ...flowEnd }

		const sharesSourceX = Math.abs(p.x - elkStart.x) < eps
		const sharesTargetX = Math.abs(p.x - elkEnd.x) < eps
		let x: number
		if (sharesSourceX && !sharesTargetX) x = flowStart.x
		else if (sharesTargetX && !sharesSourceX) x = flowEnd.x
		else if (sharesSourceX && sharesTargetX) x = flowStart.x
		else x = p.x

		return { x, y: mapY(p, i) }
	})

	// Channel-mid L vs card-top/bottom corners (omit mid → enforceOrthogonal uses curr.y).
	const channelMidY = opts.elkChannelMid
		? (flowStart.y + flowEnd.y) / 2
		: undefined
	const orthogonal = enforceOrthogonal(mapped, channelMidY)
	if (!opts.elkClampDownward) return orthogonal
	return clampDownwardExit(orthogonal, flowStart.y, dyFlow > 0, channelMidY)
}

/**
 * For TB-forward edges (target below source), flatten any vertex above the source
 * bottom onto that Y so a remapped polyline cannot climb out of the card top/side.
 * Back-edges (target above) are left alone — they must travel upward.
 */
export function clampDownwardExit(
	points: { x: number; y: number }[],
	sourceBottomY: number,
	targetBelow: boolean,
	channelMidY?: number
): { x: number; y: number }[] {
	if (!targetBelow || points.length < 2) return points
	const eps = 1e-6
	const clamped = points.map((p, i) =>
		i === 0 ? { x: p.x, y: sourceBottomY } : { x: p.x, y: Math.max(p.y, sourceBottomY) }
	)
	const out: { x: number; y: number }[] = [{ ...clamped[0]! }]
	for (let i = 1; i < clamped.length; i++) {
		const prev = out[out.length - 1]!
		const curr = clamped[i]!
		if (Math.abs(prev.x - curr.x) < eps && Math.abs(prev.y - curr.y) < eps) continue
		out.push({ ...curr })
	}
	return enforceOrthogonal(out, channelMidY)
}

/**
 * Remap after placement/pack can leave diagonals; polyline edges must stay axis-aligned.
 * When `channelMidY` is set, L-corners for diagonals ride the channel mid —
 * not `curr.y` / `prev.y` (card top/bottom borders after pack).
 */
function enforceOrthogonal(
	points: { x: number; y: number }[],
	channelMidY?: number
): { x: number; y: number }[] {
	if (points.length < 2) return points
	const eps = 1e-6
	const out: { x: number; y: number }[] = [{ ...points[0]! }]
	for (let i = 1; i < points.length; i++) {
		const prev = out[out.length - 1]!
		const curr = points[i]!
		const sameX = Math.abs(prev.x - curr.x) < eps
		const sameY = Math.abs(prev.y - curr.y) < eps
		if (sameX && sameY) continue
		if (sameX || sameY) {
			out.push({ ...curr })
			continue
		}
		const bendY =
			channelMidY !== undefined &&
			Math.abs(channelMidY - prev.y) > eps &&
			Math.abs(channelMidY - curr.y) > eps
				? channelMidY
				: curr.y
		if (Math.abs(bendY - prev.y) > eps) {
			out.push({ x: prev.x, y: bendY })
		}
		if (Math.abs(bendY - curr.y) > eps) {
			out.push({ x: curr.x, y: bendY })
		}
		out.push({ ...curr })
	}
	return out
}
