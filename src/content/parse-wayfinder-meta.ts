/**
 * Stock Velite matter-loader only understands YAML `---` fences;
 * wayfinder tickets use bare `Key: value` lines after an optional H1.
 */
export function parseWayfinderMeta(raw: string): {
	title: string
	data: Record<string, string>
	content: string
} {
	const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/)
	let i = 0

	while (i < lines.length && (lines[i] ?? '').trim() === '') i++

	let title = ''
	const first = lines[i]
	if (first?.startsWith('# ')) {
		title = first.slice(2).trim()
		i++
		while (i < lines.length && (lines[i] ?? '').trim() === '') i++
	}

	const data: Record<string, string> = {}
	while (i < lines.length) {
		const line = lines[i] ?? ''
		if (line.startsWith('##')) break

		if (line.trim() === '') {
			let j = i + 1
			while (j < lines.length && (lines[j] ?? '').trim() === '') j++
			const next = lines[j]
			if (next === undefined || next.startsWith('##')) break
			i++
			continue
		}

		const match = /^([A-Za-z][A-Za-z0-9 ]*):[ \t]*(.*)$/.exec(line)
		if (!match) break
		data[match[1]!] = match[2] ?? ''
		i++
	}

	while (i < lines.length && (lines[i] ?? '').trim() === '') i++
	return { title, data, content: lines.slice(i).join('\n') }
}
