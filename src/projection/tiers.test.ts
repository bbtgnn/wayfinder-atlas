import { describe, expect, test } from 'bun:test'
import { deriveTiers } from './tiers'
import type { Ticket } from './types'

function ticket(
	partial: Pick<Ticket, 'ticketNumber' | 'status' | 'blockedBy'> &
		Partial<Ticket>
): Ticket {
	const n = partial.ticketNumber
	return {
		effort: 'fixture',
		ticketSlug: `${String(n).padStart(2, '0')}-t`,
		title: `T${n}`,
		type: 'task',
		body: '',
		...partial
	}
}

describe('deriveTiers', () => {
	test('roots with no blockers are tier 0', () => {
		const tickets = [
			ticket({ ticketNumber: 1, status: 'open', blockedBy: [] }),
			ticket({ ticketNumber: 2, status: 'open', blockedBy: [] })
		]
		expect(deriveTiers(tickets).tiers).toEqual({ 1: 0, 2: 0 })
		expect(deriveTiers(tickets).warnings).toEqual([])
	})

	test('chain accumulates +1 per hop', () => {
		const tickets = [
			ticket({ ticketNumber: 1, status: 'resolved', blockedBy: [] }),
			ticket({ ticketNumber: 2, status: 'open', blockedBy: [1] }),
			ticket({ ticketNumber: 3, status: 'open', blockedBy: [2] })
		]
		expect(deriveTiers(tickets).tiers).toEqual({ 1: 0, 2: 1, 3: 2 })
	})

	test('diamond uses max path', () => {
		const tickets = [
			ticket({ ticketNumber: 1, status: 'resolved', blockedBy: [] }),
			ticket({ ticketNumber: 2, status: 'open', blockedBy: [1] }),
			ticket({ ticketNumber: 3, status: 'open', blockedBy: [1] }),
			ticket({ ticketNumber: 4, status: 'open', blockedBy: [2, 3] })
		]
		expect(deriveTiers(tickets).tiers).toEqual({ 1: 0, 2: 1, 3: 1, 4: 2 })
	})

	test('missing blocker id ignored for tier but warned', () => {
		const tickets = [
			ticket({ ticketNumber: 1, status: 'open', blockedBy: [] }),
			ticket({ ticketNumber: 2, status: 'open', blockedBy: [99] }),
			ticket({ ticketNumber: 3, status: 'open', blockedBy: [1, 99] })
		]
		const { tiers, warnings } = deriveTiers(tickets)
		expect(tiers).toEqual({ 1: 0, 2: 0, 3: 1 })
		expect(warnings.filter((w) => w.kind === 'missing-blocker')).toEqual([
			{
				kind: 'missing-blocker',
				ticketNumber: 2,
				detail: 'Blocked by unknown issue: 99'
			},
			{
				kind: 'missing-blocker',
				ticketNumber: 3,
				detail: 'Blocked by unknown issue: 99'
			}
		])
	})

	test('cycle yields warning and finite tiers', () => {
		const tickets = [
			ticket({ ticketNumber: 1, status: 'open', blockedBy: [2] }),
			ticket({ ticketNumber: 2, status: 'open', blockedBy: [1] })
		]
		const { tiers, warnings } = deriveTiers(tickets)
		expect(warnings.some((w) => w.kind === 'cycle')).toBe(true)
		expect(warnings.find((w) => w.kind === 'cycle')?.detail).toContain('01 → 02')
		expect(tiers[1]).toBeDefined()
		expect(tiers[2]).toBeDefined()
		expect(Number.isFinite(tiers[1]!)).toBe(true)
		expect(Number.isFinite(tiers[2]!)).toBe(true)
	})
})
