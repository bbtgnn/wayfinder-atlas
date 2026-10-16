import {
	LAYOUT_ENGINE_STORAGE_KEY,
	type LayoutEngine
} from './layout-engine'

/** Ordered pipeline is fixed; flags only enable/disable named stages. */
export type LayoutRecipe = {
	engine: LayoutEngine
	/** Rigid island pack; Y shelf (min-Y → 0) is part of this pass, not a separate stage. */
	packComponentsX: boolean
	/** Master: remap + channel-mid + clamp + clearObstacles. */
	elkEdgePost: boolean
	/** Only optional edge-post sub-pass; ignored when elkEdgePost is false. */
	elkSeparateLanes: boolean
}

export const LAYOUT_RECIPE_STORAGE_KEY = 'atlas.layoutRecipe'

/** Cold-start / dogfood default: ELK + island pack + edge post + separate lanes. */
export const DEFAULT_RECIPE: LayoutRecipe = {
	engine: 'elk',
	packComponentsX: true,
	elkEdgePost: true,
	elkSeparateLanes: true
}

/** Escape hatch: dagre place; edge-post is a no-op. */
export const DAGRE_RECIPE: LayoutRecipe = {
	engine: 'dagre',
	packComponentsX: true,
	elkEdgePost: false,
	elkSeparateLanes: false
}

/**
 * Resolve layout recipe for a dogfood session.
 *
 * Precedence: `?layout=elk|dagre` / `?elk=` → `localStorage['atlas.layoutRecipe']` →
 * migrate `atlas.layoutEngine` → default.
 * Pass `search` / `storage` in tests; browser callers omit both.
 */
export function resolveLayoutRecipe(opts?: {
	search?: string
	storage?: Pick<Storage, 'getItem'> | null
}): LayoutRecipe {
	const search =
		opts?.search ?? (typeof location !== 'undefined' ? location.search : '')
	const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)

	const layout = params.get('layout')?.toLowerCase()
	if (layout === 'elk') return { ...DEFAULT_RECIPE }
	if (layout === 'dagre') return { ...DAGRE_RECIPE }

	const elkFlag = params.get('elk')
	if (elkFlag === '1' || elkFlag === 'true') return { ...DEFAULT_RECIPE }
	if (elkFlag === '0' || elkFlag === 'false') return { ...DAGRE_RECIPE }

	const storage =
		opts && 'storage' in opts
			? opts.storage
			: typeof localStorage !== 'undefined'
				? localStorage
				: null

	const storedRecipe = parseStoredRecipe(storage?.getItem(LAYOUT_RECIPE_STORAGE_KEY))
	if (storedRecipe) return storedRecipe

	const legacyEngine = storage?.getItem(LAYOUT_ENGINE_STORAGE_KEY)?.toLowerCase()
	if (legacyEngine === 'elk') return { ...DEFAULT_RECIPE }
	if (legacyEngine === 'dagre') return { ...DAGRE_RECIPE }

	return { ...DEFAULT_RECIPE }
}

/** Persist recipe JSON under `atlas.layoutRecipe` (WayfinderView writes on toggle). */
export function persistLayoutRecipe(
	recipe: LayoutRecipe,
	storage?: Pick<Storage, 'setItem'> | null
): void {
	const target =
		storage !== undefined
			? storage
			: typeof localStorage !== 'undefined'
				? localStorage
				: null
	target?.setItem(LAYOUT_RECIPE_STORAGE_KEY, JSON.stringify(recipe))
}

/** Field-wise recipe equality for default detection. */
export function recipeEquals(a: LayoutRecipe, b: LayoutRecipe): boolean {
	return (
		a.engine === b.engine &&
		a.packComponentsX === b.packComponentsX &&
		a.elkEdgePost === b.elkEdgePost &&
		a.elkSeparateLanes === b.elkSeparateLanes
	)
}

/** Map old recipe JSON → shrunk shape; ignore removed keys. */
export function parseStoredRecipe(raw: string | null | undefined): LayoutRecipe | null {
	if (!raw) return null
	try {
		const parsed = JSON.parse(raw) as Record<string, unknown>
		if (parsed.engine !== 'dagre' && parsed.engine !== 'elk') return null
		return {
			engine: parsed.engine,
			packComponentsX:
				typeof parsed.packComponentsX === 'boolean'
					? parsed.packComponentsX
					: parsed.engine === 'elk',
			elkEdgePost:
				typeof parsed.elkEdgePost === 'boolean' ? parsed.elkEdgePost : false,
			elkSeparateLanes:
				typeof parsed.elkSeparateLanes === 'boolean'
					? parsed.elkSeparateLanes
					: true
		}
	} catch {
		return null
	}
}
