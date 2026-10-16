import { issues, maps } from '../.velite/index.js'

const efforts = [...new Set(maps.map((m) => m.effort))].sort()
const byEffort = Object.fromEntries(
	efforts.map((effort) => [
		effort,
		{
			issues: issues.filter((i) => i.effort === effort).length,
			mapTitle: maps.find((m) => m.effort === effort)?.title
		}
	])
)

console.log(
	JSON.stringify(
		{
			efforts,
			issueCount: issues.length,
			mapCount: maps.length,
			byEffort
		},
		null,
		2
	)
)
