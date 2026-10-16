export type MapSection = {
	id: string
	heading: string
	body: string
}

export function sectionId(heading: string): string {
	const h = heading.trim().toLowerCase()
	if (h.startsWith('destination')) return 'destination'
	if (h.startsWith('notes')) return 'notes'
	if (/^decisions[\s-]*so[\s-]*far/.test(h)) return 'decisions'
	if (h.startsWith('fog') || h.startsWith('not yet specified')) return 'fog'
	if (h.startsWith('out of scope')) return 'outOfScope'
	return heading.trim()
}

type OpenSection = { id: string; heading: string; lines: string[] }

function flushSection(current: OpenSection | null, sections: MapSection[]): void {
	if (!current) return
	sections.push({
		id: current.id,
		heading: current.heading,
		body: current.lines.join('\n').trim()
	})
}

export function splitMapSections(content: string): MapSection[] {
	const lines = content.split(/\r?\n/)
	const sections: MapSection[] = []
	let current: OpenSection | null = null

	for (const line of lines) {
		const match = /^##\s+(.+)$/.exec(line)
		if (match) {
			flushSection(current, sections)
			const heading = match[1]!.trim()
			current = { id: sectionId(heading), heading, lines: [] }
			continue
		}
		current?.lines.push(line)
	}

	flushSection(current, sections)
	return sections
}
