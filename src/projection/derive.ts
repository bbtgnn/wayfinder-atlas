import type { BlockerEdge, Ticket, TicketStatus } from './types'

function statusByNumber(tickets: Ticket[]): Map<number, TicketStatus> {
	return new Map(tickets.map((t) => [t.ticketNumber, t.status]))
}

/** Missing blockers count as unresolved — a listed id with no ticket is not treated as done. */
export function isUnblocked(ticket: Ticket, byNumber: Map<number, TicketStatus>): boolean {
	return ticket.blockedBy.every((n) => byNumber.get(n) === 'resolved')
}

export function deriveFrontier(tickets: Ticket[]): Ticket[] {
	const byNumber = statusByNumber(tickets)
	return tickets.filter(
		(t) => t.status === 'open' && isUnblocked(t, byNumber)
	)
}

/** Includes tickets whose blockers are missing from the set, not only still-open ones. */
export function deriveBlocked(tickets: Ticket[]): Ticket[] {
	const byNumber = statusByNumber(tickets)
	return tickets.filter((t) => !isUnblocked(t, byNumber))
}

export function deriveResolved(tickets: Ticket[]): Ticket[] {
	return tickets.filter((t) => t.status === 'resolved')
}

/** Direction is blocker → dependent; only `blockedBy` edges (no reverse invent). */
export function deriveEdges(tickets: Ticket[]): BlockerEdge[] {
	const edges: BlockerEdge[] = []
	for (const ticket of tickets) {
		for (const from of ticket.blockedBy) {
			edges.push({ from, to: ticket.ticketNumber })
		}
	}
	return edges
}
