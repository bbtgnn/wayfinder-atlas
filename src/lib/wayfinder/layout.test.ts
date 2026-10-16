import { describe, expect, test } from 'bun:test'
import type { Edge } from '@xyflow/svelte'
import type { EffortProjection, Ticket } from '../../projection/types'
import { flowFromProjection } from './flow-from-projection'
import { layoutDag } from './layout'
import { layoutElk } from './layout-elk'
import {
	LAYOUT_NODE_H,
	LAYOUT_NODE_SEP,
	LAYOUT_NODE_W,
	packSameTierX,
	pinTierY,
	tierBandY
} from './layout-node-post'
import { DAGRE_RECIPE, DEFAULT_RECIPE } from './layout-recipe'
import type { TicketFlowNode } from './types'

function ticket(n: number): Ticket {
	return {
		effort: 'fixture',
		ticketNumber: n,
		ticketSlug: `${String(n).padStart(2, '0')}-t`,
		title: `T${n}`,
		type: 'task',
		status: 'open',
		blockedBy: [],
		body: ''
	}
}

function node(n: number): TicketFlowNode {
	return {
		id: String(n),
		type: 'ticket',
		position: { x: 0, y: 0 },
		data: { ticket: ticket(n), frontier: false, blocked: false }
	}
}

function projection(
	ticketNums: number[],
	edges: { from: number; to: number }[],
	tiers: Record<number, number>
): EffortProjection {
	const tickets = ticketNums.map(ticket)
	return {
		effort: 'fixture',
		map: { effort: 'fixture', title: 'fixture', sections: [] },
		tickets,
		frontier: [],
		blocked: [],
		resolved: [],
		edges,
		tiers,
		warnings: []
	}
}

function assertTierYGlobal(
	laid: TicketFlowNode[],
	tiers: Record<number, number>
): void {
	const byId = Object.fromEntries(laid.map((n) => [n.id, n.position]))
	for (const [id, pos] of Object.entries(byId)) {
		expect(pos.y).toBe(tierBandY(tiers[Number(id)] ?? 0))
	}
	const tierYs = new Map<number, number>()
	for (const n of laid) {
		const t = tiers[Number(n.id)] ?? 0
		const y = n.position.y
		const prev = tierYs.get(t)
		if (prev !== undefined) expect(y).toBe(prev)
		else tierYs.set(t, y)
	}
	const sortedTiers = [...tierYs.keys()].sort((a, b) => a - b)
	for (let i = 1; i < sortedTiers.length; i++) {
		const above = tierYs.get(sortedTiers[i - 1]!)!
		const below = tierYs.get(sortedTiers[i]!)!
		expect(below).toBeGreaterThan(above)
	}
}

function assertNoTierXOverlap(
	laid: TicketFlowNode[],
	tiers: Record<number, number>
): void {
	const byTier = new Map<number, TicketFlowNode[]>()
	for (const n of laid) {
		const t = tiers[Number(n.id)] ?? 0
		const list = byTier.get(t) ?? []
		list.push(n)
		byTier.set(t, list)
	}
	for (const tierNodes of byTier.values()) {
		const sorted = [...tierNodes].sort((a, b) => a.position.x - b.position.x)
		for (let i = 1; i < sorted.length; i++) {
			const gap = sorted[i]!.position.x - sorted[i - 1]!.position.x
			expect(gap).toBeGreaterThanOrEqual(LAYOUT_NODE_W + LAYOUT_NODE_SEP)
		}
	}
}

const engines = [
	{
		name: 'dagre',
		run: async (n: TicketFlowNode[], e: Edge[], t: Record<number, number>) =>
			layoutDag(n, e, t)
	},
	{ name: 'elk', run: layoutElk }
] as const

for (const engine of engines) {
	describe(`${engine.name} place (raw)`, () => {
		test('sets engine XY without pinning Y to tierBandY', async () => {
			const nodes = [node(1), node(2), node(3)]
			const edges: Edge[] = [
				{ id: 'e-1-2', source: '1', target: '2' },
				{ id: 'e-2-3', source: '2', target: '3' }
			]
			const tiers = { 1: 0, 2: 0, 3: 1 }
			const { nodes: laid } = await engine.run(nodes, edges, tiers)
			for (const n of laid) {
				expect(Number.isFinite(n.position.x)).toBe(true)
				expect(Number.isFinite(n.position.y)).toBe(true)
			}
			const byId = Object.fromEntries(laid.map((n) => [n.id, n.position.y]))
			expect(byId['2']).not.toBe(tierBandY(0))
			pinTierY(laid, tiers)
			assertTierYGlobal(laid, tiers)
		})
	})
}

describe('node-post Tier helpers (direct)', () => {
	test('pinTierY + packSameTierX: same Tier shares Y; no X overlap', async () => {
		const nodes = [node(1), node(2), node(3), node(4)]
		const edges: Edge[] = [
			{ id: 'e-1-2', source: '1', target: '2' },
			{ id: 'e-1-4', source: '1', target: '4' },
			{ id: 'e-2-3', source: '2', target: '3' },
			{ id: 'e-4-3', source: '4', target: '3' }
		]
		const tiers = { 1: 0, 2: 1, 4: 1, 3: 2 }
		const { nodes: laid } = await layoutElk(nodes, edges, tiers)
		pinTierY(laid, tiers)
		packSameTierX(laid, tiers)
		const byId = Object.fromEntries(laid.map((n) => [n.id, n.position]))
		expect(byId['2']!.y).toBe(byId['4']!.y)
		expect(byId['1']!.y).toBeLessThan(byId['2']!.y)
		expect(byId['2']!.y).toBeLessThan(byId['3']!.y)
		assertTierYGlobal(laid, tiers)
		assertNoTierXOverlap(laid, tiers)
	})
})

describe('pipeline DEFAULT_RECIPE', () => {
	test('pack runs, elk polylines; tier posts not applied', async () => {
		expect(DEFAULT_RECIPE.packComponentsX).toBe(true)
		expect(DEFAULT_RECIPE.elkEdgePost).toBe(true)
		expect(DEFAULT_RECIPE.elkSeparateLanes).toBe(true)
		const disjoint = projection(
			[1, 2, 3, 4],
			[
				{ from: 1, to: 2 },
				{ from: 3, to: 4 }
			],
			{ 1: 0, 2: 1, 3: 0, 4: 1 }
		)
		const { nodes, edges } = await flowFromProjection(disjoint, DEFAULT_RECIPE)
		const minY = Math.min(...nodes.map((n) => n.position.y))
		const minX = Math.min(...nodes.map((n) => n.position.x))
		expect(minY).toBe(0)
		expect(minX).toBe(0)
		expect(edges.some((e) => e.type === 'elk')).toBe(true)
	})

	test('dagre escape: smoothstep edges, no elk polylines', async () => {
		const proj = projection(
			[1, 2, 3],
			[
				{ from: 1, to: 2 },
				{ from: 1, to: 3 }
			],
			{ 1: 0, 2: 1, 3: 1 }
		)
		const { edges } = await flowFromProjection(proj, DAGRE_RECIPE)
		expect(edges.every((e) => e.type === 'smoothstep')).toBe(true)
	})
})

describe('elk edge routing payload', () => {
	test('attaches remapped polyline points on elk edges when sections exist', async () => {
		const proj = projection(
			[1, 2, 3],
			[
				{ from: 1, to: 2 },
				{ from: 1, to: 3 }
			],
			{ 1: 0, 2: 1, 3: 1 }
		)
		const { edges: laid } = await flowFromProjection(proj, DEFAULT_RECIPE)
		const withPoints = laid.filter((e) => e.type === 'elk')
		expect(withPoints.length).toBeGreaterThan(0)
		for (const e of withPoints) {
			const points = (e.data as { points?: { x: number; y: number }[] } | undefined)
				?.points
			expect(points?.length).toBeGreaterThanOrEqual(2)
		}
	})

	test('remapped elk polylines stay axis-aligned after pack + edge-post', async () => {
		const proj = projection(
			[1, 2, 3, 4],
			[
				{ from: 1, to: 2 },
				{ from: 1, to: 3 },
				{ from: 2, to: 4 },
				{ from: 3, to: 4 }
			],
			{ 1: 0, 2: 1, 3: 1, 4: 2 }
		)
		const { edges: laid } = await flowFromProjection(proj, DEFAULT_RECIPE)
		const eps = 1e-6
		for (const e of laid.filter((edge) => edge.type === 'elk')) {
			const points = (e.data as { points?: { x: number; y: number }[] } | undefined)
				?.points
			expect(points?.length).toBeGreaterThanOrEqual(2)
			for (let i = 1; i < points!.length; i++) {
				const a = points![i - 1]!
				const b = points![i]!
				const axisAligned =
					Math.abs(a.x - b.x) < eps || Math.abs(a.y - b.y) < eps
				expect(axisAligned).toBe(true)
			}
		}
	})

	test('TB edges start at source bottom-center and never go above it toward a lower target', async () => {
		const proj = projection(
			[1, 2, 3, 4],
			[
				{ from: 1, to: 2 },
				{ from: 1, to: 3 },
				{ from: 2, to: 4 },
				{ from: 3, to: 4 }
			],
			{ 1: 0, 2: 1, 3: 1, 4: 2 }
		)
		const { nodes: laidNodes, edges: laidEdges } = await flowFromProjection(
			proj,
			DEFAULT_RECIPE
		)
		const byId = Object.fromEntries(laidNodes.map((n) => [n.id, n.position]))
		const eps = 0.5
		for (const e of laidEdges.filter((edge) => edge.type === 'elk')) {
			const source = byId[e.source]!
			const target = byId[e.target]!
			if (!(target.y > source.y)) continue
			const points = (e.data as { points?: { x: number; y: number }[] } | undefined)
				?.points
			expect(points?.length).toBeGreaterThanOrEqual(2)
			const srcBottom = { x: source.x + LAYOUT_NODE_W / 2, y: source.y + LAYOUT_NODE_H }
			expect(Math.abs(points![0]!.x - srcBottom.x)).toBeLessThan(eps)
			expect(Math.abs(points![0]!.y - srcBottom.y)).toBeLessThan(eps)
			for (const p of points!) {
				expect(p.y).toBeGreaterThanOrEqual(srcBottom.y - eps)
			}
			for (let i = 1; i < points!.length; i++) {
				const a = points![i - 1]!
				const b = points![i]!
				if (Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6) continue
				expect(b.y).toBeGreaterThanOrEqual(a.y - eps)
				break
			}
		}
	})
})
