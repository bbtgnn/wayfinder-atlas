import type { TicketFlowNode } from './types'
import { LAYOUT_NODE_H, LAYOUT_NODE_SEP, LAYOUT_NODE_W } from './layout-node-post'

/** Wider than card–card gap so weakly-connected islands read as blocks. */
export const COMPONENT_SEP = 2 * LAYOUT_NODE_SEP

type LayoutEdge = { source: string; target: string }

type ComponentBBox = {
	ids: string[]
	minX: number
	minY: number
	maxX: number
	maxY: number
	/** Min numeric ticket id for stable sort when minX ties. */
	minId: number
}

/**
 * Rigid-body pack of weakly-connected islands: top-align each island's
 * min-Y → 0, then left→right bbox pack with COMPONENT_SEP. Tier-agnostic.
 */
export function packComponentsX(nodes: TicketFlowNode[], edges: LayoutEdge[]): void {
	if (nodes.length === 0) return

	const byId = new Map(nodes.map((n) => [n.id, n]))
	const adj = new Map<string, Set<string>>()
	for (const n of nodes) adj.set(n.id, new Set())

	for (const e of edges) {
		if (!byId.has(e.source) || !byId.has(e.target)) continue
		adj.get(e.source)!.add(e.target)
		adj.get(e.target)!.add(e.source)
	}

	const seen = new Set<string>()
	const components: string[][] = []
	for (const n of nodes) {
		if (seen.has(n.id)) continue
		const ids: string[] = []
		const queue = [n.id]
		seen.add(n.id)
		while (queue.length > 0) {
			const id = queue.pop()!
			ids.push(id)
			for (const nb of adj.get(id)!) {
				if (seen.has(nb)) continue
				seen.add(nb)
				queue.push(nb)
			}
		}
		components.push(ids)
	}

	const bboxes: ComponentBBox[] = components.map((ids) => {
		let minX = Infinity
		let minY = Infinity
		let maxX = -Infinity
		let maxY = -Infinity
		let minId = Infinity
		for (const id of ids) {
			const n = byId.get(id)!
			minX = Math.min(minX, n.position.x)
			minY = Math.min(minY, n.position.y)
			maxX = Math.max(maxX, n.position.x + LAYOUT_NODE_W)
			maxY = Math.max(maxY, n.position.y + LAYOUT_NODE_H)
			minId = Math.min(minId, Number(id))
		}
		return { ids, minX, minY, maxX, maxY, minId }
	})

	// Top-align every island onto y = 0 (rigid dy).
	for (const box of bboxes) {
		const dy = -box.minY
		if (dy === 0) continue
		for (const id of box.ids) {
			byId.get(id)!.position.y += dy
		}
		box.minY = 0
		box.maxY += dy
	}

	bboxes.sort((a, b) => {
		const dx = a.minX - b.minX
		if (dx !== 0) return dx
		return a.minId - b.minId
	})

	let cursorX = 0
	for (const box of bboxes) {
		const dx = cursorX - box.minX
		if (dx !== 0) {
			for (const id of box.ids) {
				byId.get(id)!.position.x += dx
			}
			box.minX += dx
			box.maxX += dx
		}
		cursorX = box.maxX + COMPONENT_SEP
	}
}
