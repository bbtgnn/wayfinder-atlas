import { defineConfig, s } from 'velite'
import { splitMapSections } from './src/content/map-sections'
import { normalizeBlockedBy } from './src/content/normalize-blocked-by'
import { wayfinderMd } from './src/content/wayfinder-loader'

// Relative to this config file. Absolute via import.meta.url breaks after Velite
// esbuild-compiles the config; ATLAS_CONTENT_ROOT is read when the compiled config runs.
const contentRoot = process.env.ATLAS_CONTENT_ROOT?.trim() || 'content'

export default defineConfig({
	root: contentRoot,
	output: {
		data: '.velite',
		assets: 'static',
		clean: true
	},
	markdown: {
		copyLinkedFiles: false
	},
	loaders: [wayfinderMd],
	collections: {
		issues: {
			name: 'Issue',
			// S1 dogfood: wayfinder efforts only (build/post-review omit Type/Map).
			pattern: '{atlas,pre-build}/issues/*.md',
			schema: s
				.object({
					title: s.string(),
					type: s.string(),
					status: s.string(),
					blockedBy: s.string(),
					map: s.string(),
					content: s.raw(),
					path: s.path()
				})
				.transform((data) => {
					const parts = data.path.split('/')
					const effort = parts[0] ?? ''
					const ticketSlug = parts[2] ?? ''
					const ticketNumber = Number(ticketSlug.match(/^(\d+)/)?.[1])
					return {
						...data,
						blockedBy: normalizeBlockedBy(data.blockedBy),
						effort,
						ticketSlug,
						ticketNumber
					}
				})
		},
		maps: {
			name: 'Map',
			pattern: '{atlas,pre-build}/map.md',
			schema: s
				.object({
					title: s.string(),
					label: s.string().optional(),
					charted: s.string().optional(),
					content: s.raw(),
					path: s.path()
				})
				.transform((data) => ({
					...data,
					effort: data.path.split('/')[0] ?? '',
					sections: splitMapSections(data.content)
				}))
		}
	}
})
