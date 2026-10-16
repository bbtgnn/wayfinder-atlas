/** Build Velite before tests so `.velite` exists on a cold checkout. */

import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
const velite = join(root, 'node_modules', '.bin', 'velite')
const result = spawnSync(velite, ['build', '--strict'], {
	cwd: root,
	stdio: 'inherit',
	env: process.env
})

if (result.status !== 0) {
	process.exit(result.status ?? 1)
}
