import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { issues, maps } from '../.velite/index.js'
import {
	buildDogfoodReport,
	serializeDogfoodReport
} from '../src/projection/dogfood-report.ts'

/** Wall-clock cap so a hung projection/import cannot stall CI or agent sessions. */
const HARNESS_TIMEOUT_MS = 30_000

const timeout = setTimeout(() => {
	console.error(`dogfood harness timed out after ${HARNESS_TIMEOUT_MS}ms`)
	process.exit(124)
}, HARNESS_TIMEOUT_MS)

const ROOT = join(import.meta.dir, '..')
const REPORT_PATH = join(ROOT, 'measurements', 'harness-report.json')
const write = process.argv.includes('--write')

const report = buildDogfoodReport(issues, maps)
const serialized = serializeDogfoodReport(report)

if (write) {
	mkdirSync(join(ROOT, 'measurements'), { recursive: true })
	writeFileSync(REPORT_PATH, serialized)
	console.log(`wrote ${REPORT_PATH}`)
	console.log(serialized)
	clearTimeout(timeout)
	process.exit(0)
}

let golden: string
try {
	golden = readFileSync(REPORT_PATH, 'utf8')
} catch {
	console.error(`missing golden: ${REPORT_PATH}`)
	console.error('run: bun run harness -- --write')
	clearTimeout(timeout)
	process.exit(1)
}

if (serialized !== golden) {
	console.error('dogfood harness drift: live projection counts ≠ committed golden')
	console.error(`golden: ${REPORT_PATH}`)
	console.error('live:\n' + serialized)
	console.error('expected:\n' + golden)
	console.error('If counts changed intentionally: bun run harness -- --write')
	clearTimeout(timeout)
	process.exit(1)
}

console.log(serialized.trimEnd())
console.log(`dogfood harness ok: ${REPORT_PATH}`)
clearTimeout(timeout)
process.exit(0)
