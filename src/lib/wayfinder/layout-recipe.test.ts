import { describe, expect, test } from 'bun:test'
import {
	DAGRE_RECIPE,
	DEFAULT_RECIPE,
	LAYOUT_RECIPE_STORAGE_KEY,
	parseStoredRecipe,
	persistLayoutRecipe,
	recipeEquals,
	resolveLayoutRecipe
} from './layout-recipe'
import { LAYOUT_ENGINE_STORAGE_KEY } from './layout-engine'

describe('resolveLayoutRecipe', () => {
	test('defaults to DEFAULT_RECIPE', () => {
		expect(resolveLayoutRecipe({ search: '', storage: null })).toEqual(DEFAULT_RECIPE)
	})

	test('honors ?layout=elk and ?layout=dagre', () => {
		expect(resolveLayoutRecipe({ search: '?layout=elk', storage: null })).toEqual(
			DEFAULT_RECIPE
		)
		expect(resolveLayoutRecipe({ search: '?layout=dagre', storage: null })).toEqual(
			DAGRE_RECIPE
		)
	})

	test('honors ?elk=1 shorthand; query beats storage', () => {
		const storage = {
			getItem: () => JSON.stringify(DAGRE_RECIPE)
		}
		expect(resolveLayoutRecipe({ search: '?elk=1', storage })).toEqual(DEFAULT_RECIPE)
	})

	test('honors ?elk=0 as dagre; ?layout= beats stored recipe', () => {
		const storage = {
			getItem: () => JSON.stringify(DEFAULT_RECIPE)
		}
		expect(resolveLayoutRecipe({ search: '?elk=0', storage })).toEqual(DAGRE_RECIPE)
		expect(resolveLayoutRecipe({ search: '?layout=dagre', storage })).toEqual(DAGRE_RECIPE)
	})

	test('loads atlas.layoutRecipe JSON from storage', () => {
		const custom: typeof DEFAULT_RECIPE = {
			engine: 'elk',
			packComponentsX: false,
			elkEdgePost: false,
			elkSeparateLanes: false
		}
		const storage = {
			getItem: (key: string) =>
				key === LAYOUT_RECIPE_STORAGE_KEY ? JSON.stringify(custom) : null
		}
		expect(resolveLayoutRecipe({ search: '', storage })).toEqual(custom)
	})

	test('migrates old recipe: drops tier/sub-flags; packComponentsX defaults true for elk', () => {
		const legacy = {
			engine: 'elk' as const,
			pinTierY: true,
			packSameTierX: true,
			elkEdgePost: false,
			elkChannelMid: false,
			elkClampDownward: false,
			elkClearObstacles: false,
			elkSeparateLanes: false
		}
		expect(parseStoredRecipe(JSON.stringify(legacy))).toEqual({
			engine: 'elk',
			packComponentsX: true,
			elkEdgePost: false,
			elkSeparateLanes: false
		})
	})

	test('migrates old recipe: keeps elkEdgePost; elkSeparateLanes defaults true', () => {
		const legacyOn = {
			engine: 'elk' as const,
			pinTierY: true,
			packSameTierX: true,
			elkEdgePost: true
		}
		expect(parseStoredRecipe(JSON.stringify(legacyOn))).toEqual({
			engine: 'elk',
			packComponentsX: true,
			elkEdgePost: true,
			elkSeparateLanes: true
		})

		const legacyLanesOff = {
			engine: 'elk' as const,
			packComponentsX: true,
			elkEdgePost: true,
			elkSeparateLanes: false
		}
		expect(parseStoredRecipe(JSON.stringify(legacyLanesOff))).toEqual(legacyLanesOff)
	})

	test('prefers stored recipe over legacy atlas.layoutEngine', () => {
		const stored = {
			engine: 'elk' as const,
			packComponentsX: false,
			elkEdgePost: false,
			elkSeparateLanes: false
		}
		const storage = {
			getItem: (key: string) => {
				if (key === LAYOUT_RECIPE_STORAGE_KEY) return JSON.stringify(stored)
				if (key === LAYOUT_ENGINE_STORAGE_KEY) return 'dagre'
				return null
			}
		}
		expect(resolveLayoutRecipe({ search: '', storage })).toEqual(stored)
	})

	test('ignores invalid stored JSON and falls through', () => {
		const badJson = {
			getItem: (key: string) =>
				key === LAYOUT_RECIPE_STORAGE_KEY ? '{not-json' : null
		}
		expect(resolveLayoutRecipe({ search: '', storage: badJson })).toEqual(DEFAULT_RECIPE)
	})

	test('migrates legacy atlas.layoutEngine into default posts', () => {
		const storage = {
			getItem: (key: string) => (key === LAYOUT_ENGINE_STORAGE_KEY ? 'elk' : null)
		}
		expect(resolveLayoutRecipe({ search: '', storage })).toEqual(DEFAULT_RECIPE)

		const dagreStorage = {
			getItem: (key: string) => (key === LAYOUT_ENGINE_STORAGE_KEY ? 'dagre' : null)
		}
		expect(resolveLayoutRecipe({ search: '', storage: dagreStorage })).toEqual(DAGRE_RECIPE)
	})
})

describe('persistLayoutRecipe', () => {
	test('writes JSON under atlas.layoutRecipe', () => {
		const writes: Record<string, string> = {}
		persistLayoutRecipe(DEFAULT_RECIPE, {
			setItem: (k, v) => {
				writes[k] = v
			}
		})
		expect(writes[LAYOUT_RECIPE_STORAGE_KEY]).toBe(JSON.stringify(DEFAULT_RECIPE))
	})
})

describe('recipeEquals', () => {
	test('distinguishes packComponentsX and lanes', () => {
		expect(recipeEquals(DEFAULT_RECIPE, DAGRE_RECIPE)).toBe(false)
		expect(
			recipeEquals(DEFAULT_RECIPE, {
				...DEFAULT_RECIPE,
				elkSeparateLanes: false
			})
		).toBe(false)
		expect(recipeEquals(DEFAULT_RECIPE, { ...DEFAULT_RECIPE })).toBe(true)
	})
})
