import { issues, maps } from '../.velite/index.js'
import { ATLAS_EDGE_01_TO_08, hasAtlasEdge01to08, projectEffort } from '../src/projection/index.ts'

const atlas = projectEffort('atlas', issues, maps)

const summary = {
	effort: atlas.effort,
	ticketCount: atlas.tickets.length,
	sectionIds: atlas.map.sections.map((s) => s.id),
	frontier: atlas.frontier.map((t) => t.ticketNumber),
	blocked: atlas.blocked.map((t) => t.ticketNumber),
	resolvedCount: atlas.resolved.length,
	edgeSample: atlas.edges.filter((e) => e.to === 8),
	hasEdge1to8: hasAtlasEdge01to08(atlas.edges)
}

console.log(JSON.stringify(summary, null, 2))

if (!summary.hasEdge1to8) {
	console.error(`demo failed: expected edge ${JSON.stringify(ATLAS_EDGE_01_TO_08)}`)
	process.exit(1)
}

if (summary.sectionIds.length === 0 || summary.ticketCount === 0) {
	console.error('demo failed: expected tickets and map sections')
	process.exit(1)
}
