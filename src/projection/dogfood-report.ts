import type { Issue, Map as VeliteMap } from '../../.velite/index.js'
import { projectEffort } from './project-effort'
import type { EffortProjection } from './types'

/** Dogfood effort ids. Fixture and Attesta `.scratch` both use these slugs. */
export const DOGFOOD_EFFORTS = ['atlas', 'pre-build'] as const

export type DogfoodEffortId = (typeof DOGFOOD_EFFORTS)[number]

export type DogfoodEffortCounts = {
	effort: DogfoodEffortId
	ticketCount: number
	edgeCount: number
	frontierCount: number
}

export type DogfoodHarnessReport = {
	harness: 'dogfood-projection'
	efforts: DogfoodEffortCounts[]
}

export function countsFromProjection(
	effort: DogfoodEffortId,
	p: EffortProjection
): DogfoodEffortCounts {
	return {
		effort,
		ticketCount: p.tickets.length,
		edgeCount: p.edges.length,
		frontierCount: p.frontier.length
	}
}

/** Ordered by effort id for byte-stable goldens. */
export function buildDogfoodReport(
	issues: Issue[],
	maps: VeliteMap[]
): DogfoodHarnessReport {
	const sorted = [...DOGFOOD_EFFORTS].sort()
	return {
		harness: 'dogfood-projection',
		efforts: sorted.map((effort) =>
			countsFromProjection(effort, projectEffort(effort, issues, maps))
		)
	}
}

/** Trailing newline required for golden compare / write. */
export function serializeDogfoodReport(report: DogfoodHarnessReport): string {
	return `${JSON.stringify(report, null, 2)}\n`
}
