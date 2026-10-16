/** Which graph layout engine drives wayfinder node placement. Default stays dagre. */
export type LayoutEngine = 'dagre' | 'elk'

/** Legacy localStorage key; migrated by `resolveLayoutRecipe`. */
export const LAYOUT_ENGINE_STORAGE_KEY = 'atlas.layoutEngine'
