import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { issues, maps } from '../../.velite/index.js'
import {
	DOGFOOD_EFFORTS,
	buildDogfoodReport,
	serializeDogfoodReport
} from './dogfood-report'

const GOLDEN_PATH = join(import.meta.dir, '../../measurements/harness-report.json')

describe('dogfood harness report', () => {
	const live = buildDogfoodReport(issues, maps)
	const goldenText = readFileSync(GOLDEN_PATH, 'utf8')
	const golden = JSON.parse(goldenText) as ReturnType<typeof buildDogfoodReport>

	test('covers atlas and pre-build effort ids', () => {
		expect(live.efforts.map((e) => e.effort)).toEqual([...DOGFOOD_EFFORTS].sort())
	})

	test('matches committed golden (ticket/edge/frontier counts)', () => {
		expect(serializeDogfoodReport(live)).toBe(goldenText)
		expect(live).toEqual(golden)
	})

	test('serialize is byte-stable across rebuilds', () => {
		const again = buildDogfoodReport(issues, maps)
		expect(serializeDogfoodReport(again)).toBe(serializeDogfoodReport(live))
	})
})
