import { describe, expect, test } from 'bun:test'
import type { ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk-api'
import type { Edge } from '@xyflow/svelte'
import {
	applyElkEdgePost,
	clampDownwardExit,
	clearOrthogonalObstacles,
	ELK_EDGE_POST_ALL,
	OBSTACLE_PAD,
	type ElkEdgePostOpts,
	type ElkEdgeRouteData
} from './layout-elk-edge-post'
import { LAYOUT_NODE_H, LAYOUT_NODE_W, tierBandY } from './layout-node-post'
import type { TicketFlowNode } from './types'
import { ticket } from './wayfinder-test-fixtures'

type Pt = { x: number; y: number }

function nodeBox(id: string, x: number, y: number) {
	return { id, x, y, w: LAYOUT_NODE_W, h: LAYOUT_NODE_H }
}

/** Strict interior hit (pad): segment crosses inflated AABB, not merely grazing endpoints. */
function segmentHitsBox(a: Pt, b: Pt, box: ReturnType<typeof nodeBox>, pad = OBSTACLE_PAD): boolean {
	const L = box.x - pad
	const R = box.x + box.w + pad
	const T = box.y - pad
	const B = box.y + box.h + pad
	const eps = 1e-6
	if (Math.abs(a.x - b.x) < eps) {
		const x = a.x
		if (x <= L || x >= R) return false
		const y0 = Math.min(a.y, b.y)
		const y1 = Math.max(a.y, b.y)
		return y1 > T && y0 < B
	}
	if (Math.abs(a.y - b.y) < eps) {
		const y = a.y
		if (y <= T || y >= B) return false
		const x0 = Math.min(a.x, b.x)
		const x1 = Math.max(a.x, b.x)
		return x1 > L && x0 < R
	}
	return false
}

function polylineHitsObstacle(
	points: Pt[],
	obstacle: ReturnType<typeof nodeBox>,
	pad = OBSTACLE_PAD
): boolean {
	for (let i = 1; i < points.length; i++) {
		if (segmentHitsBox(points[i - 1]!, points[i]!, obstacle, pad)) return true
	}
	return false
}

/** Intermediate H segments (neither endpoint is a polyline terminal). */
function midChannelHorizontals(points: Pt[]): { y: number; x0: number; x1: number }[] {
	const eps = 1e-6
	const out: { y: number; x0: number; x1: number }[] = []
	for (let i = 1; i < points.length - 2; i++) {
		const a = points[i]!
		const b = points[i + 1]!
		if (Math.abs(a.y - b.y) > eps || Math.abs(a.x - b.x) < eps) continue
		out.push({ y: a.y, x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x) })
	}
	return out
}

function flowNode(id: string, x: number, y: number): TicketFlowNode {
	return {
		id,
		type: 'ticket',
		position: { x, y },
		data: { ticket: ticket(Number(id)), frontier: false, blocked: false }
	}
}

function elkBox(id: string, x: number, y: number): ElkNode {
	return { id, x, y, width: LAYOUT_NODE_W, height: LAYOUT_NODE_H }
}

describe('applyElkEdgePost', () => {
	test('remaps a section into axis-aligned flow points and sets type elk', () => {
		const elkSource = elkBox('1', 0, 0)
		const elkTarget = elkBox('2', 0, 200)
		const flowSource = flowNode('1', 100, 0)
		const flowTarget = flowNode('2', 100, tierBandY(2))
		const edges: Edge[] = [
			{ id: 'e-1-2', source: '1', target: '2', type: 'smoothstep' }
		]
		const elkEdges: ElkExtendedEdge[] = [
			{
				id: 'e-1-2',
				sources: ['1'],
				targets: ['2'],
				sections: [
					{
						id: 's0',
						startPoint: { x: LAYOUT_NODE_W / 2, y: LAYOUT_NODE_H },
						endPoint: { x: LAYOUT_NODE_W / 2, y: 200 },
						bendPoints: [
							{ x: LAYOUT_NODE_W / 2, y: 140 },
							{ x: LAYOUT_NODE_W / 2, y: 180 }
						]
					}
				]
			}
		]
		const elkById = new Map([
			['1', elkSource],
			['2', elkTarget]
		])
		const flowById = new Map([
			['1', flowSource],
			['2', flowTarget]
		])

		const out = applyElkEdgePost(edges, elkEdges, elkById, flowById)
		expect(out).toHaveLength(1)
		expect(out[0]!.type).toBe('elk')
		const points = (out[0]!.data as ElkEdgeRouteData).points
		expect(points.length).toBeGreaterThanOrEqual(2)
		expect(points[0]).toEqual({
			x: flowSource.position.x + LAYOUT_NODE_W / 2,
			y: flowSource.position.y + LAYOUT_NODE_H
		})
		expect(points.at(-1)).toEqual({
			x: flowTarget.position.x + LAYOUT_NODE_W / 2,
			y: flowTarget.position.y
		})
		const eps = 1e-6
		for (let i = 1; i < points.length; i++) {
			const a = points[i - 1]!
			const b = points[i]!
			expect(Math.abs(a.x - b.x) < eps || Math.abs(a.y - b.y) < eps).toBe(true)
		}
	})

	test('falls back to smoothstep when sections are missing', () => {
		const edges: Edge[] = [
			{ id: 'e-1-2', source: '1', target: '2', type: 'smoothstep' }
		]
		const out = applyElkEdgePost(
			edges,
			[{ id: 'e-1-2', sources: ['1'], targets: ['2'] }],
			new Map([['1', elkBox('1', 0, 0)]]),
			new Map([['1', flowNode('1', 0, 0)]])
		)
		expect(out[0]!.type).toBe('smoothstep')
		expect(out[0]!.data).toBeUndefined()
	})

	test('detours a remapped mid-channel vertical that pierces a packed card', () => {
		// ELK routed a free channel at x=50; after pack, card 7 sits on that X.
		const elkSource = elkBox('2', 200, 0)
		const elkTarget = elkBox('14', 200, 400)
		const flowSource = flowNode('2', 200, 0)
		const flowTarget = flowNode('14', 200, tierBandY(3))
		const obstacle = flowNode('7', 0, tierBandY(1))
		const channelX = 50
		expect(channelX).toBeGreaterThan(obstacle.position.x)
		expect(channelX).toBeLessThan(obstacle.position.x + LAYOUT_NODE_W)

		const edges: Edge[] = [
			{ id: 'e-2-14', source: '2', target: '14', type: 'smoothstep' }
		]
		const elkEdges: ElkExtendedEdge[] = [
			{
				id: 'e-2-14',
				sources: ['2'],
				targets: ['14'],
				sections: [
					{
						id: 's0',
						startPoint: { x: LAYOUT_NODE_W / 2 + 200, y: LAYOUT_NODE_H },
						endPoint: { x: LAYOUT_NODE_W / 2 + 200, y: 400 },
						bendPoints: [
							{ x: channelX, y: 120 },
							{ x: channelX, y: 360 }
						]
					}
				]
			}
		]
		const out = applyElkEdgePost(
			edges,
			elkEdges,
			new Map([
				['2', elkSource],
				['14', elkTarget],
				['7', elkBox('7', 0, 200)]
			]),
			new Map([
				['2', flowSource],
				['14', flowTarget],
				['7', obstacle]
			])
		)
		const points = (out[0]!.data as ElkEdgeRouteData).points
		expect(polylineHitsObstacle(points, nodeBox('7', obstacle.position.x, obstacle.position.y))).toBe(
			false
		)
		const eps = 1e-6
		for (let i = 1; i < points.length; i++) {
			const a = points[i - 1]!
			const b = points[i]!
			expect(Math.abs(a.x - b.x) < eps || Math.abs(a.y - b.y) < eps).toBe(true)
		}
	})

	test('L-bends from post-pack diagonal use tier channel mid, not card-top Y', () => {
		// ELK vertical (same column); pack pulls target to a different flow X → diagonal.
		const elkSource = elkBox('1', 0, 0)
		const elkTarget = elkBox('2', 0, 200)
		const flowSource = flowNode('1', 0, 0)
		const flowTarget = flowNode('2', 300, tierBandY(2))
		const sourceBottomY = flowSource.position.y + LAYOUT_NODE_H
		const targetTopY = flowTarget.position.y
		const channelMidY = (sourceBottomY + targetTopY) / 2
		const edges: Edge[] = [
			{ id: 'e-1-2', source: '1', target: '2', type: 'smoothstep' }
		]
		const elkEdges: ElkExtendedEdge[] = [
			{
				id: 'e-1-2',
				sources: ['1'],
				targets: ['2'],
				sections: [
					{
						id: 's0',
						startPoint: { x: LAYOUT_NODE_W / 2, y: LAYOUT_NODE_H },
						endPoint: { x: LAYOUT_NODE_W / 2, y: 200 }
					}
				]
			}
		]
		const out = applyElkEdgePost(
			edges,
			elkEdges,
			new Map([
				['1', elkSource],
				['2', elkTarget]
			]),
			new Map([
				['1', flowSource],
				['2', flowTarget]
			])
		)
		const points = (out[0]!.data as ElkEdgeRouteData).points
		const eps = 1e-6
		const sourceCx = flowSource.position.x + LAYOUT_NODE_W / 2
		const targetCx = flowTarget.position.x + LAYOUT_NODE_W / 2
		expect(points[0]).toEqual({ x: sourceCx, y: sourceBottomY })
		expect(points.at(-1)).toEqual({ x: targetCx, y: targetTopY })

		// No intermediate horizontal riding the card top or bottom border.
		for (let i = 1; i < points.length; i++) {
			const a = points[i - 1]!
			const b = points[i]!
			const isHorizontal = Math.abs(a.y - b.y) < eps && Math.abs(a.x - b.x) > eps
			if (!isHorizontal) continue
			expect(Math.abs(a.y - targetTopY)).toBeGreaterThan(eps)
			expect(Math.abs(a.y - sourceBottomY)).toBeGreaterThan(eps)
			expect(Math.abs(a.y - channelMidY)).toBeLessThan(eps)
		}
	})

	test('separates two edges with identical mid-channel H into distinct lane Y', () => {
		// Both L-bend through the same channel-mid Y; X-ranges overlap → stacked without lanes.
		// Cards spaced so sibling AABBs do not sit on the other edge's handle column.
		const elkA = elkBox('1', 0, 0)
		const elkB = elkBox('2', 500, 0)
		const elkC = elkBox('3', 400, 200)
		const elkD = elkBox('4', 200, 200)
		const flowA = flowNode('1', 0, 0)
		const flowB = flowNode('2', 500, 0)
		const flowC = flowNode('3', 400, tierBandY(2))
		const flowD = flowNode('4', 200, tierBandY(2))
		const sourceBottomY = flowA.position.y + LAYOUT_NODE_H
		const targetTopY = flowC.position.y
		const channelMidY = (sourceBottomY + targetTopY) / 2

		const section = (sx: number, sy: number, tx: number, ty: number) => ({
			id: 's0',
			startPoint: { x: sx + LAYOUT_NODE_W / 2, y: sy + LAYOUT_NODE_H },
			endPoint: { x: tx + LAYOUT_NODE_W / 2, y: ty }
		})

		const edges: Edge[] = [
			{ id: 'e-1-3', source: '1', target: '3', type: 'smoothstep' },
			{ id: 'e-2-4', source: '2', target: '4', type: 'smoothstep' }
		]
		const elkEdges: ElkExtendedEdge[] = [
			{
				id: 'e-1-3',
				sources: ['1'],
				targets: ['3'],
				sections: [section(0, 0, 0, 200)]
			},
			{
				id: 'e-2-4',
				sources: ['2'],
				targets: ['4'],
				sections: [section(500, 0, 500, 200)]
			}
		]
		const out = applyElkEdgePost(
			edges,
			elkEdges,
			new Map([
				['1', elkA],
				['2', elkB],
				['3', elkC],
				['4', elkD]
			]),
			new Map([
				['1', flowA],
				['2', flowB],
				['3', flowC],
				['4', flowD]
			])
		)

		const ptsA = (out[0]!.data as ElkEdgeRouteData).points
		const ptsB = (out[1]!.data as ElkEdgeRouteData).points
		const hsA = midChannelHorizontals(ptsA)
		const hsB = midChannelHorizontals(ptsB)
		expect(hsA.length).toBeGreaterThanOrEqual(1)
		expect(hsB.length).toBeGreaterThanOrEqual(1)

		const yA = hsA[0]!.y
		const yB = hsB[0]!.y
		expect(Math.abs(yA - yB)).toBeGreaterThan(1e-6)

		const eps = 1e-6
		for (const y of [yA, yB]) {
			expect(y).toBeGreaterThan(sourceBottomY + eps)
			expect(y).toBeLessThan(targetTopY - eps)
		}
		// Handles stay pinned.
		expect(ptsA[0]).toEqual({
			x: flowA.position.x + LAYOUT_NODE_W / 2,
			y: sourceBottomY
		})
		expect(ptsA.at(-1)).toEqual({
			x: flowC.position.x + LAYOUT_NODE_W / 2,
			y: targetTopY
		})
		expect(ptsB[0]).toEqual({
			x: flowB.position.x + LAYOUT_NODE_W / 2,
			y: sourceBottomY
		})
		expect(ptsB.at(-1)).toEqual({
			x: flowD.position.x + LAYOUT_NODE_W / 2,
			y: targetTopY
		})
		// Sanity: without the lane pass both would sit on channel mid.
		expect(Math.abs(channelMidY - sourceBottomY)).toBeGreaterThan(eps)
	})

	test('elkClearObstacles false leaves a remapped mid-channel vertical through a card', () => {
		const elkSource = elkBox('2', 200, 0)
		const elkTarget = elkBox('14', 200, 400)
		const flowSource = flowNode('2', 200, 0)
		const flowTarget = flowNode('14', 200, tierBandY(3))
		const obstacle = flowNode('7', 0, tierBandY(1))
		const channelX = 50
		const edges: Edge[] = [
			{ id: 'e-2-14', source: '2', target: '14', type: 'smoothstep' }
		]
		const elkEdges: ElkExtendedEdge[] = [
			{
				id: 'e-2-14',
				sources: ['2'],
				targets: ['14'],
				sections: [
					{
						id: 's0',
						startPoint: { x: LAYOUT_NODE_W / 2 + 200, y: LAYOUT_NODE_H },
						endPoint: { x: LAYOUT_NODE_W / 2 + 200, y: 400 },
						bendPoints: [
							{ x: channelX, y: 120 },
							{ x: channelX, y: 360 }
						]
					}
				]
			}
		]
		const opts: ElkEdgePostOpts = {
			...ELK_EDGE_POST_ALL,
			elkClearObstacles: false
		}
		const out = applyElkEdgePost(
			edges,
			elkEdges,
			new Map([
				['2', elkSource],
				['14', elkTarget],
				['7', elkBox('7', 0, 200)]
			]),
			new Map([
				['2', flowSource],
				['14', flowTarget],
				['7', obstacle]
			]),
			opts
		)
		const points = (out[0]!.data as ElkEdgeRouteData).points
		expect(
			polylineHitsObstacle(points, nodeBox('7', obstacle.position.x, obstacle.position.y))
		).toBe(true)
	})

	test('elkSeparateLanes false keeps two overlapping mid-channel H on the same Y', () => {
		const elkA = elkBox('1', 0, 0)
		const elkB = elkBox('2', 500, 0)
		const elkC = elkBox('3', 400, 200)
		const elkD = elkBox('4', 200, 200)
		const flowA = flowNode('1', 0, 0)
		const flowB = flowNode('2', 500, 0)
		const flowC = flowNode('3', 400, tierBandY(2))
		const flowD = flowNode('4', 200, tierBandY(2))
		const sourceBottomY = flowA.position.y + LAYOUT_NODE_H
		const targetTopY = flowC.position.y
		const channelMidY = (sourceBottomY + targetTopY) / 2

		const section = (sx: number, sy: number, tx: number, ty: number) => ({
			id: 's0',
			startPoint: { x: sx + LAYOUT_NODE_W / 2, y: sy + LAYOUT_NODE_H },
			endPoint: { x: tx + LAYOUT_NODE_W / 2, y: ty }
		})

		const edges: Edge[] = [
			{ id: 'e-1-3', source: '1', target: '3', type: 'smoothstep' },
			{ id: 'e-2-4', source: '2', target: '4', type: 'smoothstep' }
		]
		const elkEdges: ElkExtendedEdge[] = [
			{
				id: 'e-1-3',
				sources: ['1'],
				targets: ['3'],
				sections: [section(0, 0, 0, 200)]
			},
			{
				id: 'e-2-4',
				sources: ['2'],
				targets: ['4'],
				sections: [section(500, 0, 500, 200)]
			}
		]
		const opts: ElkEdgePostOpts = {
			...ELK_EDGE_POST_ALL,
			elkSeparateLanes: false
		}
		const out = applyElkEdgePost(
			edges,
			elkEdges,
			new Map([
				['1', elkA],
				['2', elkB],
				['3', elkC],
				['4', elkD]
			]),
			new Map([
				['1', flowA],
				['2', flowB],
				['3', flowC],
				['4', flowD]
			]),
			opts
		)

		const hsA = midChannelHorizontals((out[0]!.data as ElkEdgeRouteData).points)
		const hsB = midChannelHorizontals((out[1]!.data as ElkEdgeRouteData).points)
		expect(hsA.length).toBeGreaterThanOrEqual(1)
		expect(hsB.length).toBeGreaterThanOrEqual(1)
		expect(Math.abs(hsA[0]!.y - hsB[0]!.y)).toBeLessThan(1e-6)
		expect(Math.abs(hsA[0]!.y - channelMidY)).toBeLessThan(1e-6)
	})

	test('elkClampDownward false leaves a remapped bend above the source bottom', () => {
		// ELK exit climbs above the source bottom; without clamp that Y survives remap.
		const elkSource = elkBox('1', 0, 0)
		const elkTarget = elkBox('2', 0, 400)
		const flowSource = flowNode('1', 0, 0)
		const flowTarget = flowNode('2', 0, tierBandY(3))
		const sourceBottomY = flowSource.position.y + LAYOUT_NODE_H
		const edges: Edge[] = [
			{ id: 'e-1-2', source: '1', target: '2', type: 'smoothstep' }
		]
		const elkEdges: ElkExtendedEdge[] = [
			{
				id: 'e-1-2',
				sources: ['1'],
				targets: ['2'],
				sections: [
					{
						id: 's0',
						startPoint: { x: LAYOUT_NODE_W / 2, y: LAYOUT_NODE_H },
						endPoint: { x: LAYOUT_NODE_W / 2, y: 400 },
						bendPoints: [
							{ x: LAYOUT_NODE_W / 2, y: 40 },
							{ x: LAYOUT_NODE_W / 2 + 80, y: 40 },
							{ x: LAYOUT_NODE_W / 2 + 80, y: 200 }
						]
					}
				]
			}
		]
		const opts: ElkEdgePostOpts = {
			...ELK_EDGE_POST_ALL,
			elkClampDownward: false
		}
		const out = applyElkEdgePost(
			edges,
			elkEdges,
			new Map([
				['1', elkSource],
				['2', elkTarget]
			]),
			new Map([
				['1', flowSource],
				['2', flowTarget]
			]),
			opts
		)
		const points = (out[0]!.data as ElkEdgeRouteData).points
		expect(points.some((p) => p.y < sourceBottomY - 1e-6)).toBe(true)
	})

	test('elkChannelMid false places diagonal L-bends on card-top Y', () => {
		const elkSource = elkBox('1', 0, 0)
		const elkTarget = elkBox('2', 0, 200)
		const flowSource = flowNode('1', 0, 0)
		const flowTarget = flowNode('2', 300, tierBandY(2))
		const sourceBottomY = flowSource.position.y + LAYOUT_NODE_H
		const targetTopY = flowTarget.position.y
		const edges: Edge[] = [
			{ id: 'e-1-2', source: '1', target: '2', type: 'smoothstep' }
		]
		const elkEdges: ElkExtendedEdge[] = [
			{
				id: 'e-1-2',
				sources: ['1'],
				targets: ['2'],
				sections: [
					{
						id: 's0',
						startPoint: { x: LAYOUT_NODE_W / 2, y: LAYOUT_NODE_H },
						endPoint: { x: LAYOUT_NODE_W / 2, y: 200 }
					}
				]
			}
		]
		const opts: ElkEdgePostOpts = {
			...ELK_EDGE_POST_ALL,
			elkChannelMid: false
		}
		const out = applyElkEdgePost(
			edges,
			elkEdges,
			new Map([
				['1', elkSource],
				['2', elkTarget]
			]),
			new Map([
				['1', flowSource],
				['2', flowTarget]
			]),
			opts
		)
		const points = (out[0]!.data as ElkEdgeRouteData).points
		const eps = 1e-6
		const horizontals: number[] = []
		for (let i = 1; i < points.length; i++) {
			const a = points[i - 1]!
			const b = points[i]!
			if (Math.abs(a.y - b.y) < eps && Math.abs(a.x - b.x) > eps) horizontals.push(a.y)
		}
		expect(horizontals.length).toBeGreaterThanOrEqual(1)
		// Without channel-mid, bend rides target top (curr.y of the diagonal endpoint).
		expect(Math.abs(horizontals[0]! - targetTopY)).toBeLessThan(eps)
		expect(Math.abs(horizontals[0]! - sourceBottomY)).toBeGreaterThan(eps)
	})
})

describe('clearOrthogonalObstacles', () => {
	test('U-detours a vertical through a card into the free side channel', () => {
		const obstacle = nodeBox('7', 100, 150)
		// Vertical at x=120 pierces the card (100..320).
		const points: Pt[] = [
			{ x: 120, y: 100 },
			{ x: 120, y: 280 }
		]
		expect(polylineHitsObstacle(points, obstacle)).toBe(true)
		const cleared = clearOrthogonalObstacles(points, [obstacle])
		expect(polylineHitsObstacle(cleared, obstacle)).toBe(false)
		const eps = 1e-6
		for (let i = 1; i < cleared.length; i++) {
			const a = cleared[i - 1]!
			const b = cleared[i]!
			expect(Math.abs(a.x - b.x) < eps || Math.abs(a.y - b.y) < eps).toBe(true)
		}
		expect(cleared[0]).toEqual(points[0])
		expect(cleared.at(-1)).toEqual(points.at(-1))
	})

	test('U-detours a horizontal through a card into free Y', () => {
		const obstacle = nodeBox('7', 100, 150)
		const points: Pt[] = [
			{ x: 50, y: 200 },
			{ x: 400, y: 200 }
		]
		expect(polylineHitsObstacle(points, obstacle)).toBe(true)
		const cleared = clearOrthogonalObstacles(points, [obstacle])
		expect(polylineHitsObstacle(cleared, obstacle)).toBe(false)
		expect(cleared[0]).toEqual(points[0])
		expect(cleared.at(-1)).toEqual(points.at(-1))
	})
})

describe('clampDownwardExit', () => {
	test('flattens an upward first bend onto the source bottom for TB-forward edges', () => {
		const sourceBottomY = 100
		const points = [
			{ x: 50, y: 100 },
			{ x: 50, y: 40 },
			{ x: 120, y: 40 },
			{ x: 120, y: 160 }
		]
		const clamped = clampDownwardExit(points, sourceBottomY, true)
		expect(clamped[0]).toEqual({ x: 50, y: 100 })
		for (const p of clamped) {
			expect(p.y).toBeGreaterThanOrEqual(sourceBottomY)
		}
		expect(clamped[1]!.y).toBeGreaterThanOrEqual(sourceBottomY)
		const firstMove = clamped.find((p, i) => {
			if (i === 0) return false
			const prev = clamped[i - 1]!
			return Math.abs(prev.x - p.x) > 1e-6 || Math.abs(prev.y - p.y) > 1e-6
		})
		expect(firstMove).toBeDefined()
		expect(firstMove!.y).toBeGreaterThanOrEqual(sourceBottomY)
	})

	test('leaves back-edge polylines untouched when target is above', () => {
		const points = [
			{ x: 50, y: 400 },
			{ x: 50, y: 200 },
			{ x: 80, y: 200 },
			{ x: 80, y: 0 }
		]
		expect(clampDownwardExit(points, 400, false)).toEqual(points)
	})
})
