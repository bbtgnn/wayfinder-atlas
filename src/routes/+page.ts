import { issues, maps } from '../../.velite/index.js'
import { DOGFOOD_EFFORTS, projectEffort } from '../projection/index.js'
import type { EffortProjection } from '../projection/types.js'

/** Client-only: Svelte Flow needs the browser. */
export const ssr = false

export function load() {
	const projections: Record<string, EffortProjection> = {}

	for (const effort of DOGFOOD_EFFORTS) {
		const hasMap = maps.some((m) => m.effort === effort)
		if (!hasMap) continue
		projections[effort] = projectEffort(effort, issues, maps)
	}

	const keys = Object.keys(projections)
	if (keys.length === 0) {
		throw new Error('wayfinder: no dogfood efforts found in Velite collections')
	}

	const initialEffort = projections.atlas ? 'atlas' : keys[0]!

	return { projections, initialEffort }
}
