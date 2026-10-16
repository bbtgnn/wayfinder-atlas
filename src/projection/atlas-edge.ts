import type { BlockerEdge } from './types'

/** Dogfood fixture: atlas ticket 01 blocks 08. */
export const ATLAS_EDGE_01_TO_08 = { from: 1, to: 8 } as const satisfies BlockerEdge

export function hasAtlasEdge01to08(edges: readonly BlockerEdge[]): boolean {
	return edges.some(
		(e) => e.from === ATLAS_EDGE_01_TO_08.from && e.to === ATLAS_EDGE_01_TO_08.to
	)
}
