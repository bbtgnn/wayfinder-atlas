/** Closed wayfinder ticket types — lint vocabulary; UI must look up, not invent colors. */
export type WayfinderTicketType = 'research' | 'prototype' | 'grilling' | 'task'

export type TicketTypeVisual = {
	/** CSS color value (prefer `--atlas-type-*` vars). */
	color: string
	label: string
	/** Filled path `d` for a 16×16 viewBox. */
	iconPath: string
}

const TICKET_TYPE_VISUAL = {
	research: {
		color: 'var(--atlas-type-research)',
		label: 'research',
		// Magnifying glass — discover / dig
		iconPath:
			'M6.5 1.5a5 5 0 1 0 3.16 8.9l3.22 3.22a1 1 0 0 0 1.41-1.41l-3.22-3.22A5 5 0 0 0 6.5 1.5zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z'
	},
	prototype: {
		color: 'var(--atlas-type-prototype)',
		label: 'prototype',
		// Beaker — try / spike
		iconPath:
			'M5.5 1.5h5a1 1 0 0 1 0 2H10v4.17l2.78 5.56A1.5 1.5 0 0 1 11.44 15H4.56a1.5 1.5 0 0 1-1.34-2.27L6 7.67V3.5H5.5a1 1 0 0 1 0-2zM7.5 7.9 5.3 12.5h5.4L8.5 7.9V3.5h-1v4.4z'
	},
	grilling: {
		color: 'var(--atlas-type-grilling)',
		label: 'grilling',
		// Chat bubbles — stress-test questions
		iconPath:
			'M2 3.5A2.5 2.5 0 0 1 4.5 1h5A2.5 2.5 0 0 1 12 3.5V6a2.5 2.5 0 0 1-2.5 2.5H7l-2.2 1.76A.5.5 0 0 1 4 9.9V8.5A2.5 2.5 0 0 1 2 6V3.5zm8.5 6.5H12a2 2 0 0 1 2 2v.9a.5.5 0 0 1-.8.4L11.7 12H10.5A2 2 0 0 1 8.5 10V9.5h2z'
	},
	task: {
		color: 'var(--atlas-type-task)',
		label: 'task',
		// Checklist — do the work
		iconPath:
			'M3.5 2A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 12.5 2h-9zm6.03 3.97a.75.75 0 0 1 1.06 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 1 1 1.06-1.06l.97.97 2.97-2.97z'
	}
} as const satisfies Record<WayfinderTicketType, TicketTypeVisual>

const UNKNOWN_VISUAL: TicketTypeVisual = {
	color: 'var(--atlas-type-unknown)',
	label: 'unknown',
	iconPath:
		'M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM7.25 5a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1 0 1.5h-.25a.75.75 0 0 0 0 1.5H8v.25a.75.75 0 0 0 1.5 0V8.5A2.25 2.25 0 0 0 7.25 6.25V5zm.75 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z'
}

export function ticketTypeVisual(type: string): TicketTypeVisual {
	if (type in TICKET_TYPE_VISUAL) {
		return TICKET_TYPE_VISUAL[type as WayfinderTicketType]
	}
	return { ...UNKNOWN_VISUAL, label: type || 'unknown' }
}
