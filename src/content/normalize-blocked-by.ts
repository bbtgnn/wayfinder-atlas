export function normalizeBlockedBy(raw: string | number[] | undefined): number[] {
	if (Array.isArray(raw)) return raw
	const value = (raw ?? '').trim()
	if (!value || value.toLowerCase() === 'none') return []
	return value
		.split(/[,]+/)
		.map((part) => part.trim())
		.filter(Boolean)
		.map((part) => Number(part))
		.filter((n) => Number.isFinite(n))
}
