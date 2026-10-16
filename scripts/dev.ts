/** Run Velite watch + Vite/Kit together; kill both on signal or either exit. */

import { join } from 'node:path'

const pkgRoot = join(import.meta.dir, '..')
const bin = (name: string) => join(pkgRoot, 'node_modules', '.bin', name)

const children = [
	Bun.spawn([bin('velite'), 'dev'], {
		cwd: pkgRoot,
		stdout: 'inherit',
		stderr: 'inherit',
		stdin: 'inherit'
	}),
	Bun.spawn([bin('vite'), 'dev'], {
		cwd: pkgRoot,
		stdout: 'inherit',
		stderr: 'inherit',
		stdin: 'inherit'
	})
]

let shuttingDown = false

function killAll(signal: NodeJS.Signals = 'SIGTERM') {
	for (const child of children) {
		try {
			child.kill(signal)
		} catch {
			// already exited
		}
	}
}

function shutdown(code: number, signal: NodeJS.Signals = 'SIGTERM') {
	if (shuttingDown) return
	shuttingDown = true
	killAll(signal)
	const force = setTimeout(() => {
		killAll('SIGKILL')
		process.exit(code)
	}, 2000)
	force.unref()
	void Promise.all(children.map((c) => c.exited)).then(() => {
		clearTimeout(force)
		process.exit(code)
	})
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.on(signal, () => {
		shutdown(signal === 'SIGINT' ? 130 : 143, signal)
	})
}

const exitCode = await Promise.race(children.map((c) => c.exited))
if (!shuttingDown) {
	killAll()
	await Promise.all(children.map((c) => c.exited))
	process.exit(exitCode)
}
// signal handler owns exit
await new Promise(() => {})
