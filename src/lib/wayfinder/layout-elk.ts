import type { ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk-api'
import { Position, type Edge } from '@xyflow/svelte'
import {
	LAYOUT_NODE_H,
	LAYOUT_NODE_SEP,
	LAYOUT_NODE_W,
	LAYOUT_RANK_GAP
} from './layout-node-post'
import type { TicketFlowNode } from './types'

type ElkInstance = {
	layout: (graph: ElkNode) => Promise<ElkNode>
}

let elkSingleton: Promise<ElkInstance> | null = null

/**
 * elkjs 0.12 FakeWorker CJS export is skipped when `self` exists (Bun / Node 22+).
 * Browser uses the bundled build; tests/Node use FakeWorker via a brief `self` delete.
 * See kieler/elkjs#377.
 */
function getElk(): Promise<ElkInstance> {
	if (!elkSingleton) elkSingleton = createElk()
	return elkSingleton
}

async function createElk(): Promise<ElkInstance> {
	if (typeof document !== 'undefined') {
		const { default: ELKBundled } = await import('elkjs/lib/elk.bundled.js')
		return new ELKBundled()
	}

	const { default: ELK } = await import('elkjs/lib/elk-api.js')
	const FakeWorker = loadFakeWorkerCtor()
	return new ELK({ workerFactory: () => new FakeWorker() })
}

function loadFakeWorkerCtor(): new (url?: string) => Worker {
	const g = globalThis as { self?: unknown }
	const hadSelf = Object.prototype.hasOwnProperty.call(globalThis, 'self')
	const backup = g.self
	delete g.self
	// CJS worker shim — only for Bun/Node tests (not Vite browser).
	const mod = require('elkjs/lib/elk-worker.min.js') as {
		Worker: new (url?: string) => Worker
	}
	if (hadSelf) g.self = backup
	else delete g.self
	return mod.Worker
}

export type ElkPlaceResult = {
	nodes: TicketFlowNode[]
	edges: Edge[]
	/** Unmapped ELK sections / node boxes for optional elkEdgePost. */
	elkEdges: ElkExtendedEdge[]
	elkById: Map<string, ElkNode>
}

/**
 * ELK Layered (TB, orthogonal routing) raw placement with Atlas Tier as partitions.
 *
 * Returns engine XY only; keeps section payloads + ELK node boxes for edge-post.
 * FIXED_SIDE ports (SOUTH source / NORTH target) match TicketNode handles.
 */
export async function layoutElk(
	nodes: TicketFlowNode[],
	edges: Edge[],
	tiers: Record<number, number>
): Promise<ElkPlaceResult> {
	const graph: ElkNode = {
		id: 'root',
		layoutOptions: {
			'elk.algorithm': 'layered',
			'elk.direction': 'DOWN',
			// ORTHOGONAL = H/V segments only (not POLYLINE diagonals / SPLINES curves).
			'elk.edgeRouting': 'ORTHOGONAL',
			// Default false; set explicitly so long-edge dummies do not inject collinear bends.
			'elk.layered.unnecessaryBendpoints': 'false',
			'elk.partitioning.activate': 'true',
			'elk.spacing.nodeNode': String(LAYOUT_NODE_SEP),
			'elk.layered.spacing.nodeNodeBetweenLayers': String(LAYOUT_RANK_GAP),
			'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
			'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP'
		},
		children: nodes.map((n) => {
			const tier = tiers[Number(n.id)] ?? 0
			return {
				id: n.id,
				width: LAYOUT_NODE_W,
				height: LAYOUT_NODE_H,
				layoutOptions: {
					'elk.partitioning.partition': String(tier),
					'elk.portConstraints': 'FIXED_SIDE'
				},
				ports: [
					{ id: portId(n.id, 'n'), layoutOptions: { 'elk.port.side': 'NORTH' } },
					{ id: portId(n.id, 's'), layoutOptions: { 'elk.port.side': 'SOUTH' } }
				]
			}
		}),
		edges: edges.map((e) => ({
			id: e.id,
			sources: [portId(e.source, 's')],
			targets: [portId(e.target, 'n')]
		}))
	}

	const elk = await getElk()
	const laid = await elk.layout(graph)
	const elkById = new Map((laid.children ?? []).map((c) => [c.id, c]))

	const layouted = nodes.map((n) => {
		const elkNode = elkById.get(n.id)
		return {
			...n,
			targetPosition: Position.Top,
			sourcePosition: Position.Bottom,
			position: {
				x: elkNode?.x ?? 0,
				y: elkNode?.y ?? 0
			}
		}
	})

	return {
		nodes: layouted,
		edges,
		elkEdges: (laid.edges ?? []) as ElkExtendedEdge[],
		elkById
	}
}

function portId(nodeId: string, side: 'n' | 's'): string {
	return `${nodeId}:${side}`
}
