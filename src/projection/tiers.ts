import type { GraphWarning, Ticket } from './types'

export type TierDerivation = {
	/** ticketNumber → Tier (0 = no existing blockers). */
	tiers: Record<number, number>
	warnings: GraphWarning[]
}

/**
 * Missing blocker ids are ignored for Tier (warned); cycles get a warning and a
 * finite Tier via the visiting skip so recursion cannot blow the stack.
 */
export function deriveTiers(tickets: Ticket[]): TierDerivation {
	const existing = new Set(tickets.map((t) => t.ticketNumber))
	const byNumber = new Map(tickets.map((t) => [t.ticketNumber, t]))
	const warnings: GraphWarning[] = []

	for (const ticket of tickets) {
		for (const blocker of ticket.blockedBy) {
			if (!existing.has(blocker)) {
				warnings.push({
					kind: 'missing-blocker',
					ticketNumber: ticket.ticketNumber,
					detail: `Blocked by unknown issue: ${String(blocker).padStart(2, '0')}`
				})
			}
		}
	}

	const cycle = detectDependencyCycle(tickets, existing)
	if (cycle) {
		warnings.push({
			kind: 'cycle',
			detail: `dependency cycle: ${cycle.map((n) => String(n).padStart(2, '0')).join(' → ')}`
		})
	}

	const tiers: Record<number, number> = {}
	const visiting = new Set<number>()
	const done = new Set<number>()

	function tierOf(n: number): number {
		if (done.has(n)) return tiers[n]!
		// Cycle edge: skip so Tier stays finite; cycle already warned above.
		if (visiting.has(n)) return 0

		visiting.add(n)
		const ticket = byNumber.get(n)
		const blockers = (ticket?.blockedBy ?? []).filter((b) => existing.has(b))
		let tier = 0
		if (blockers.length > 0) {
			let maxBlockerTier = -1
			for (const b of blockers) {
				if (visiting.has(b)) continue
				maxBlockerTier = Math.max(maxBlockerTier, tierOf(b))
			}
			tier = maxBlockerTier < 0 ? 0 : 1 + maxBlockerTier
		}
		visiting.delete(n)
		tiers[n] = tier
		done.add(n)
		return tier
	}

	for (const ticket of tickets) {
		tierOf(ticket.ticketNumber)
	}

	return { tiers, warnings }
}

/** Edges are dependent → blocker (follow `blockedBy`) for cycle walk. */
function detectDependencyCycle(
	tickets: Ticket[],
	existing: Set<number>
): number[] | null {
	const graph = new Map<number, number[]>()
	for (const ticket of tickets) {
		graph.set(
			ticket.ticketNumber,
			ticket.blockedBy.filter((b) => existing.has(b))
		)
	}

	const visiting = new Set<number>()
	const visited = new Set<number>()
	const stack: number[] = []

	function dfs(n: number): number[] | null {
		if (visiting.has(n)) {
			const start = stack.indexOf(n)
			return stack.slice(start).concat(n)
		}
		if (visited.has(n)) return null
		visiting.add(n)
		stack.push(n)
		for (const b of graph.get(n) ?? []) {
			const c = dfs(b)
			if (c) return c
		}
		stack.pop()
		visiting.delete(n)
		visited.add(n)
		return null
	}

	for (const n of graph.keys()) {
		const c = dfs(n)
		if (c) return c
	}
	return null
}
