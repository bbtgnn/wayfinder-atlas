import { describe, expect, test } from 'bun:test'
import { issues, maps } from '../../.velite/index.js'
import { ATLAS_EDGE_01_TO_08, hasAtlasEdge01to08 } from './atlas-edge'
import { deriveFrontier } from './derive'
import { projectEffort } from './project-effort'
import type { Ticket } from './types'

describe('atlas live EffortProjection', () => {
	const atlas = projectEffort('atlas', issues, maps)

	test('exposes tickets, map sections, frontier, edges, tiers', () => {
		expect(atlas.effort).toBe('atlas')
		expect(atlas.tickets.length).toBeGreaterThan(0)
		expect(atlas.map.sections.map((s) => s.id)).toEqual(
			expect.arrayContaining(['destination', 'notes', 'decisions', 'fog', 'outOfScope'])
		)
		expect(Array.isArray(atlas.frontier)).toBe(true)
		expect(Array.isArray(atlas.edges)).toBe(true)
		expect(Object.keys(atlas.tiers).length).toBe(atlas.tickets.length)
		expect(Array.isArray(atlas.warnings)).toBe(true)
		for (const t of atlas.tickets) {
			expect(atlas.tiers[t.ticketNumber]).toBeGreaterThanOrEqual(0)
		}
	})

	test('known Blocked by edge: 01 → 08', () => {
		expect(hasAtlasEdge01to08(atlas.edges)).toBe(true)
		expect(atlas.edges).toContainEqual(ATLAS_EDGE_01_TO_08)
	})

	test('frontier membership for an open unblocked ticket', () => {
		const openUnblocked: Ticket = {
			effort: 'atlas',
			ticketNumber: 99,
			ticketSlug: '99-frontier-probe',
			title: 'Frontier probe',
			type: 'task',
			status: 'open',
			blockedBy: [],
			body: '## Question\n\nprobe\n'
		}
		expect(deriveFrontier([...atlas.tickets, openUnblocked]).map((t) => t.ticketNumber)).toContain(
			99
		)
	})

	test('ticket 08 has answerGist from ## Answer', () => {
		const eight = atlas.tickets.find((t) => t.ticketNumber === 8)
		expect(eight?.answerGist).toBeDefined()
		expect(eight!.answerGist!).toContain('Velite')
	})
})
