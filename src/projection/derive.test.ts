import { describe, expect, test } from 'bun:test'
import { extractAnswerGist } from './answer-gist'
import {
	deriveBlocked,
	deriveEdges,
	deriveFrontier,
	deriveResolved
} from './derive'
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

describe('deriveFrontier', () => {
	test('open ∧ unblocked ∧ unclaimed', () => {
		const tickets = [
			ticket({ ticketNumber: 1, status: 'resolved', blockedBy: [] }),
			ticket({ ticketNumber: 2, status: 'open', blockedBy: [] }),
			ticket({ ticketNumber: 3, status: 'open', blockedBy: [1] }),
			ticket({ ticketNumber: 4, status: 'claimed', blockedBy: [] }),
			ticket({ ticketNumber: 5, status: 'open', blockedBy: [6] }),
			ticket({ ticketNumber: 6, status: 'open', blockedBy: [] })
		]
		expect(deriveFrontier(tickets).map((t) => t.ticketNumber)).toEqual([2, 3, 6])
	})
})

describe('deriveBlocked / deriveResolved / deriveEdges', () => {
	test('blocked when any blocker is not resolved', () => {
		const tickets = [
			ticket({ ticketNumber: 1, status: 'resolved', blockedBy: [] }),
			ticket({ ticketNumber: 2, status: 'open', blockedBy: [1] }),
			ticket({ ticketNumber: 3, status: 'open', blockedBy: [4] }),
			ticket({ ticketNumber: 4, status: 'claimed', blockedBy: [] })
		]
		expect(deriveBlocked(tickets).map((t) => t.ticketNumber)).toEqual([3])
		expect(deriveResolved(tickets).map((t) => t.ticketNumber)).toEqual([1])
	})

	test('edges are blocker → ticket from blockedBy only', () => {
		const tickets = [
			ticket({ ticketNumber: 7, status: 'open', blockedBy: [1, 2] }),
			ticket({ ticketNumber: 8, status: 'open', blockedBy: [1] }),
			ticket({ ticketNumber: 9, status: 'open', blockedBy: [] })
		]
		expect(deriveEdges(tickets)).toEqual([
			{ from: 1, to: 7 },
			{ from: 2, to: 7 },
			{ from: 1, to: 8 }
		])
	})
})

describe('extractAnswerGist', () => {
	test('returns trimmed ## Answer body', () => {
		const body = `## Question\n\nQ?\n\n## Answer\n\nGo with Velite.\n\n## Comments\n\n- note\n`
		expect(extractAnswerGist(body)).toBe('Go with Velite.')
	})

	test('undefined when no Answer heading', () => {
		expect(extractAnswerGist('## Question\n\nonly\n')).toBeUndefined()
	})
})
