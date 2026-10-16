/** Stops at the next H2 so later sections (e.g. Comments) stay out of the gist. */
export function extractAnswerGist(body: string): string | undefined {
	const lines = body.split(/\r?\n/)
	let start = -1
	for (let i = 0; i < lines.length; i++) {
		if (/^##\s+Answer\s*$/i.test(lines[i] ?? '')) {
			start = i + 1
			break
		}
	}
	if (start < 0) return undefined

	const chunk: string[] = []
	for (let i = start; i < lines.length; i++) {
		const line = lines[i] ?? ''
		if (/^##\s+/.test(line)) break
		chunk.push(line)
	}

	const text = chunk.join('\n').trim()
	return text.length > 0 ? text : undefined
}
