import { defineLoader } from 'velite'
import { parseWayfinderMeta } from './parse-wayfinder-meta'

/** Wins over stock matter-loader: wayfinder files use Key: value lines, not YAML fences. */
export const wayfinderMd = defineLoader({
	name: 'wayfinder',
	test: /\.md$/,
	load: (file) => {
		const { data, content, title } = parseWayfinderMeta(file.toString())
		return {
			data: {
				title,
				type: data['Type'],
				status: data['Status'],
				blockedBy: data['Blocked by'] ?? '',
				map: data['Map'],
				label: data['Label'],
				charted: data['Charted']
			},
			content
		}
	}
})
