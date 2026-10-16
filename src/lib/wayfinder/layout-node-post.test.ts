import { describe, expect, test } from 'bun:test'
import {
	LAYOUT_NODE_SEP,
	LAYOUT_NODE_W,
	packSameTierX,
	pinTierY,
	tierBandY
} from './layout-node-post'
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

describe('pinTierY', () => {
	test('overwrites Y from Projection tiers; leaves X alone', () => {
		const nodes = [node(1, 10, 999), node(2, 40, 888), node(3, 70, 777)]
		const tiers = { 1: 0, 2: 1, 3: 1 }
		pinTierY(nodes, tiers)
		expect(nodes.map((n) => n.position)).toEqual([
			{ x: 10, y: tierBandY(0) },
			{ x: 40, y: tierBandY(1) },
			{ x: 70, y: tierBandY(1) }
		])
	})
})

describe('packSameTierX', () => {
	test('pushes overlapping same-tier cards apart; different tiers untouched', () => {
		const nodes = [
			node(1, 0, 0),
			node(2, 10, 0), // overlaps 1 on Tier 0
			node(3, 5, 200) // Tier 1 — close X is fine
		]
		const tiers = { 1: 0, 2: 0, 3: 1 }
		packSameTierX(nodes, tiers)
		expect(nodes[1]!.position.x).toBe(LAYOUT_NODE_W + LAYOUT_NODE_SEP)
		expect(nodes[0]!.position.x).toBe(0)
		expect(nodes[2]!.position.x).toBe(5)
	})

	test('stable id tie-break when X equal', () => {
		const nodes = [node(3, 0, 0), node(1, 0, 0), node(2, 0, 0)]
		packSameTierX(nodes, { 1: 0, 2: 0, 3: 0 })
		const xs = Object.fromEntries(nodes.map((n) => [n.id, n.position.x]))
		expect(xs['1']).toBe(0)
		expect(xs['2']).toBe(LAYOUT_NODE_W + LAYOUT_NODE_SEP)
		expect(xs['3']).toBe(2 * (LAYOUT_NODE_W + LAYOUT_NODE_SEP))
	})
})
