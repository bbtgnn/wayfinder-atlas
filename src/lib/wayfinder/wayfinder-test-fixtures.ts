import type { Ticket } from '../../projection/types'

export function ticket(n: number): Ticket {
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
