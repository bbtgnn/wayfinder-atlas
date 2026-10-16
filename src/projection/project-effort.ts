import type { Issue, Map as VeliteMap } from '../../.velite/index.js'
import {
	deriveBlocked,
	deriveEdges,
	deriveFrontier,
	deriveResolved
} from './derive'
import { deriveTiers } from './tiers'
import { toTicket } from './to-ticket'
import type { EffortMap, EffortProjection } from './types'

function toEffortMap(map: VeliteMap): EffortMap {
	return {
		effort: map.effort,
		title: map.title,
		...(map.label !== undefined ? { label: map.label } : {}),
		...(map.charted !== undefined ? { charted: map.charted } : {}),
		sections: map.sections
	}
}

export function projectEffort(
	effort: string,
	issues: Issue[],
	maps: VeliteMap[]
): EffortProjection {
	const mapDoc = maps.find((m) => m.effort === effort)
	if (!mapDoc) {
		throw new Error(`wayfinder projection: no map for effort ${effort}`)
	}

	const tickets = issues
		.filter((i) => i.effort === effort)
		.map(toTicket)
		.sort((a, b) => a.ticketNumber - b.ticketNumber)

	const { tiers, warnings } = deriveTiers(tickets)

	return {
		effort,
		map: toEffortMap(mapDoc),
		tickets,
		frontier: deriveFrontier(tickets),
		blocked: deriveBlocked(tickets),
		resolved: deriveResolved(tickets),
		edges: deriveEdges(tickets),
		tiers,
		warnings
	}
}
