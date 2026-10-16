import dagre from '@dagrejs/dagre'
import { Position, type Edge } from '@xyflow/svelte'
import {
	LAYOUT_NODE_H,
	LAYOUT_NODE_SEP,
	LAYOUT_NODE_W,
	LAYOUT_RANK_GAP
} from './layout-node-post'
import type { TicketFlowNode } from './types'

/**
 * TB dagre raw placement (X seed via barycenter + Brandes–Köpf).
 * Component pack / edge-post run in `flowFromProjection`.
 */
export function layoutDag(
	nodes: TicketFlowNode[],
	edges: Edge[],
	tiers: Record<number, number>
): { nodes: TicketFlowNode[]; edges: Edge[] } {
	const g = new dagre.graphlib.Graph()
	g.setDefaultEdgeLabel(() => ({}))
	g.setGraph({
		rankdir: 'TB',
		nodesep: LAYOUT_NODE_SEP,
		ranksep: LAYOUT_RANK_GAP,
		ranker: 'longest-path'
	})

	for (const n of nodes) {
		g.setNode(n.id, { width: LAYOUT_NODE_W, height: LAYOUT_NODE_H })
	}
	for (const e of edges) {
		const fromTier = tiers[Number(e.source)] ?? 0
		const toTier = tiers[Number(e.target)] ?? 0
		const minlen = Math.max(1, toTier - fromTier)
		g.setEdge(e.source, e.target, { minlen })
	}
	dagre.layout(g)

	const layouted = nodes.map((n) => {
		const p = g.node(n.id)
		return {
			...n,
			targetPosition: Position.Top,
			sourcePosition: Position.Bottom,
			position: {
				x: p.x - LAYOUT_NODE_W / 2,
				y: p.y - LAYOUT_NODE_H / 2
			}
		}
	})

	return { nodes: layouted, edges }
}
