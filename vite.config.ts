import process from 'node:process'
import adapter from '@sveltejs/adapter-static'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

/** GitHub Pages serves the site from /<repo>. Local `vite dev` stays at /. */
function pagesBase(): '' | `/${string}` {
	if (process.argv.includes('dev')) return ''
	const raw = process.env.BASE_PATH ?? ''
	if (raw === '') return ''
	if (!raw.startsWith('/') || raw.endsWith('/')) {
		throw new Error(`BASE_PATH must be empty or a root path like /wayfinder-atlas, got ${JSON.stringify(raw)}`)
	}
	return raw as `/${string}`
}

export default defineConfig({
	server: {
		port: 4444,
		strictPort: true
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				fallback: '404.html'
			}),
			paths: {
				base: pagesBase()
			}
		})
	]
})
