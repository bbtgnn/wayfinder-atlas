import type { TicketFlowNode } from './types'

/** Must match TicketNode CSS — taller card after type/status chrome. */
const NODE_W = 220
const NODE_H = 100
/** Vertical gap between Tier bands; matches dagre `ranksep` for visual rhythm. */
const RANK_GAP = 56
/** Horizontal clear gap between cards in the same Tier band. */
const NODE_SEP = 40

export const LAYOUT_NODE_W = NODE_W
export const LAYOUT_NODE_H = NODE_H
export const LAYOUT_NODE_SEP = NODE_SEP
export const LAYOUT_RANK_GAP = RANK_GAP

/** Absolute Y for a Projection Tier band (top of card). */
export function tierBandY(tier: number): number {
	return tier * (NODE_H + RANK_GAP)
}

/** Overwrite each node's Y from Projection Tier (global band per tier). */
export function pinTierY(nodes: TicketFlowNode[], tiers: Record<number, number>): void {
	for (const n of nodes) {
		n.position.y = tierBandY(tiers[Number(n.id)] ?? 0)
	}
}

/**
 * Same-Tier cards can share a Y band even when the placer ranked them in
 * different components — engine `nodesep` no longer applies. Pack-only
 * left→right restores NODE_W+NODE_SEP (no parent-mean; that fights BK on
 * multi-parent DAGs — see `2026-10-15-hierarchical-parent-center-layout.md`).
 */
export function packSameTierX(nodes: TicketFlowNode[], tiers: Record<number, number>): void {
	const byTier = new Map<number, TicketFlowNode[]>()
	for (const n of nodes) {
		const t = tiers[Number(n.id)] ?? 0
		const list = byTier.get(t) ?? []
		list.push(n)
		byTier.set(t, list)
	}
	for (const tierNodes of byTier.values()) {
		const sorted = [...tierNodes].sort((a, b) => {
			const dx = a.position.x - b.position.x
			if (dx !== 0) return dx
			return Number(a.id) - Number(b.id)
		})
		for (let i = 1; i < sorted.length; i++) {
			const prev = sorted[i - 1]!
			const cur = sorted[i]!
			const minX = prev.position.x + NODE_W + NODE_SEP
			if (cur.position.x < minX) cur.position.x = minX
		}
	}
}
