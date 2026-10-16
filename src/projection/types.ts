export type TicketStatus = 'open' | 'claimed' | 'resolved'

export function isTicketStatus(value: string): value is TicketStatus {
	return value === 'open' || value === 'claimed' || value === 'resolved'
}

export type Ticket = {
	effort: string
	ticketNumber: number
	ticketSlug: string
	title: string
	type: string
	status: TicketStatus
	blockedBy: number[]
	body: string
	answerGist?: string
}

/** Stable cross-effort identity; ticketNumber alone is only unique within an effort. */
export function ticketKey(effort: string, ticketSlug: string): string {
	return `${effort}/${ticketSlug}`
}

// Unknown ## headings keep their trimmed text as id (see sectionId in map-sections).
export type MapSectionId =
	| 'destination'
	| 'notes'
	| 'decisions'
	| 'fog'
	| 'outOfScope'
	| string

export type EffortMap = {
	effort: string
	title: string
	label?: string
	charted?: string
	sections: { id: MapSectionId; heading: string; body: string }[]
}

export type BlockerEdge = { from: number; to: number }

export type GraphWarningKind = 'missing-blocker' | 'cycle'

export type GraphWarning = {
	kind: GraphWarningKind
	ticketNumber?: number
	detail: string
}

export type EffortProjection = {
	effort: string
	map: EffortMap
	tickets: Ticket[]
	frontier: Ticket[]
	blocked: Ticket[]
	resolved: Ticket[]
	edges: BlockerEdge[]
	/** ticketNumber → Tier; derived once — views must not recompute. */
	tiers: Record<number, number>
	warnings: GraphWarning[]
}
