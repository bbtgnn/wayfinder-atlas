import type { Edge } from '@xyflow/svelte'
import type { EffortProjection } from '../../projection/types'
import { applyElkEdgePost, ELK_EDGE_POST_ALL } from './layout-elk-edge-post'
import { layoutDag } from './layout'
import { layoutElk, type ElkPlaceResult } from './layout-elk'
import { packComponentsX } from './layout-component-post'
import { DEFAULT_RECIPE, type LayoutRecipe } from './layout-recipe'
import type { TicketFlowNode } from './types'

/** Map EffortProjection → Svelte Flow nodes/edges. Frontier flags come from projection only. */
export async function flowFromProjection(
	proj: EffortProjection,
	recipe: LayoutRecipe = DEFAULT_RECIPE
): Promise<{
	nodes: TicketFlowNode[]
	edges: Edge[]
}> {
	const frontierIds = new Set(proj.frontier.map((t) => t.ticketNumber))
	const blockedIds = new Set(proj.blocked.map((t) => t.ticketNumber))

	const rawNodes: TicketFlowNode[] = proj.tickets.map((ticket) => ({
		id: String(ticket.ticketNumber),
		type: 'ticket' as const,
		position: { x: 0, y: 0 },
		data: {
			ticket,
			frontier: frontierIds.has(ticket.ticketNumber),
			blocked: blockedIds.has(ticket.ticketNumber)
		}
	}))

	const rawEdges: Edge[] = proj.edges.map((e) => ({
		id: `e-${e.from}-${e.to}`,
		source: String(e.from),
		target: String(e.to),
		type: 'smoothstep',
		animated: false
	}))

	let nodes: TicketFlowNode[]
	let edges: Edge[]
	let elkPlace: Pick<ElkPlaceResult, 'elkEdges' | 'elkById'> | null = null

	if (recipe.engine === 'elk') {
		const placed = await layoutElk(rawNodes, rawEdges, proj.tiers)
		nodes = placed.nodes
		edges = placed.edges
		elkPlace = { elkEdges: placed.elkEdges, elkById: placed.elkById }
	} else {
		const placed = layoutDag(rawNodes, rawEdges, proj.tiers)
		nodes = placed.nodes
		edges = placed.edges
	}

	// Edge-post remaps against post-pack XY; pack must run first when both are on.
	if (recipe.packComponentsX) packComponentsX(nodes, edges)

	if (recipe.elkEdgePost && elkPlace) {
		const byId = new Map(nodes.map((n) => [n.id, n]))
		edges = applyElkEdgePost(edges, elkPlace.elkEdges, elkPlace.elkById, byId, {
			...ELK_EDGE_POST_ALL,
			elkSeparateLanes: recipe.elkSeparateLanes
		})
	}

	return { nodes, edges }
}
