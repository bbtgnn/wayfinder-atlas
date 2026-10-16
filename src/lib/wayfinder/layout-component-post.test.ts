import { describe, expect, test } from 'bun:test'
import {
	COMPONENT_SEP,
	packComponentsX
} from './layout-component-post'
import { LAYOUT_NODE_H, LAYOUT_NODE_W } from './layout-node-post'
import type { TicketFlowNode } from './types'
import { ticket } from './wayfinder-test-fixtures'

function node(n: number, x: number, y: number): TicketFlowNode {
	return {
		id: String(n),
		type: 'ticket',
		position: { x, y },
		data: { ticket: ticket(n), frontier: false, blocked: false }
	}
}

function edge(from: number, to: number) {
	return { source: String(from), target: String(to) }
}

function componentMinY(nodes: TicketFlowNode[], ids: number[]): number {
	return Math.min(...ids.map((id) => nodes.find((n) => n.id === String(id))!.position.y))
}

function componentMaxX(nodes: TicketFlowNode[], ids: number[]): number {
	return Math.max(
		...ids.map((id) => {
			const n = nodes.find((x) => x.id === String(id))!
			return n.position.x + LAYOUT_NODE_W
		})
	)
}

function componentMinX(nodes: TicketFlowNode[], ids: number[]): number {
	return Math.min(...ids.map((id) => nodes.find((n) => n.id === String(id))!.position.x))
}

describe('packComponentsX', () => {
	test('two disjoint edges → two islands; equal minY 0; X gap ≥ COMPONENT_SEP', () => {
		// Island A: 1→2 at left; island B: 3→4 scattered in Y
		const nodes = [
			node(1, 100, 50),
			node(2, 100, 200),
			node(3, 500, 300),
			node(4, 500, 450)
		]
		packComponentsX(nodes, [edge(1, 2), edge(3, 4)])

		expect(componentMinY(nodes, [1, 2])).toBe(0)
		expect(componentMinY(nodes, [3, 4])).toBe(0)

		const aMax = componentMaxX(nodes, [1, 2])
		const bMin = componentMinX(nodes, [3, 4])
		expect(bMin - aMax).toBeGreaterThanOrEqual(COMPONENT_SEP)
		expect(componentMinX(nodes, [1, 2])).toBe(0)
	})

	test('preserves relative XY inside an island (rigid body)', () => {
		const nodes = [node(1, 10, 40), node(2, 30, 90), node(3, 200, 10)]
		const before = nodes.map((n) => ({ id: n.id, ...n.position }))
		packComponentsX(nodes, [edge(1, 2)]) // 3 is isolate

		const a1 = nodes.find((n) => n.id === '1')!
		const a2 = nodes.find((n) => n.id === '2')!
		const b1 = before.find((p) => p.id === '1')!
		const b2 = before.find((p) => p.id === '2')!
		expect(a2.position.x - a1.position.x).toBe(b2.x - b1.x)
		expect(a2.position.y - a1.position.y).toBe(b2.y - b1.y)
	})

	test('equal minX → ticket-id tie-break for pack order', () => {
		// Two isolates at same X; smaller id packs first (left)
		const nodes = [node(5, 0, 10), node(2, 0, 80)]
		packComponentsX(nodes, [])
		const xs = Object.fromEntries(nodes.map((n) => [n.id, n.position.x]))
		expect(xs['2']).toBe(0)
		expect(xs['5']).toBe(LAYOUT_NODE_W + COMPONENT_SEP)
		expect(nodes.every((n) => n.position.y === 0)).toBe(true)
	})

	test('dangling edge (missing endpoint) does not merge islands', () => {
		const nodes = [node(1, 0, 10), node(2, 300, 50)]
		packComponentsX(nodes, [
			edge(1, 99), // 99 missing
			edge(2, 99)
		])
		// Still two islands → packed apart
		expect(componentMinX(nodes, [1])).toBe(0)
		expect(componentMinX(nodes, [2])).toBe(LAYOUT_NODE_W + COMPONENT_SEP)
	})

	test('singleton-only graph → origin normalize', () => {
		const nodes = [node(7, 40, 60)]
		packComponentsX(nodes, [])
		expect(nodes[0]!.position).toEqual({ x: 0, y: 0 })
	})

	test('second call leaves already-packed layout stable', () => {
		const nodes = [
			node(1, 100, 50),
			node(2, 100, 200),
			node(3, 500, 300),
			node(4, 500, 450)
		]
		const edges = [edge(1, 2), edge(3, 4)]
		packComponentsX(nodes, edges)
		const once = nodes.map((n) => ({ id: n.id, ...n.position }))
		packComponentsX(nodes, edges)
		expect(nodes.map((n) => ({ id: n.id, ...n.position }))).toEqual(once)
	})

	test('COMPONENT_SEP is 2× node sep; bbox uses layout node size', () => {
		expect(COMPONENT_SEP).toBe(80)
		const nodes = [node(1, 0, 0), node(2, 0, LAYOUT_NODE_H)]
		packComponentsX(nodes, [])
		expect(componentMinX(nodes, [2]) - componentMaxX(nodes, [1])).toBe(COMPONENT_SEP)
	})
})
