<script lang="ts">
	import type { LayoutProps } from './$types'

	let { children }: LayoutProps = $props()
</script>

<svelte:head>
	<title>Atlas</title>
</svelte:head>

{@render children()}

<style>
	:global(:root) {
		color-scheme: light;
		--atlas-bg: #f3efe6;
		--atlas-ink: #1a1a1a;
		--atlas-panel: #fffdf8;
		--atlas-line: #cfc6b6;
		--atlas-frontier: #0b6e4f;
		--atlas-claimed: #b45309;
		--atlas-resolved: #64748b;
		--atlas-blocked: #94a3b8;
		--atlas-open: #1e3a5f;
		/* Ticket type accents — warm paper palette, no purple default. */
		--atlas-type-research: #0d5c63;
		--atlas-type-prototype: #a33b1a;
		--atlas-type-grilling: #7c2d3a;
		--atlas-type-task: #1e3a5f;
		--atlas-type-unknown: #78716c;
		--atlas-ui-font: 'IBM Plex Sans', 'Segoe UI', sans-serif;
	}

	:global(html),
	:global(body) {
		margin: 0;
		height: 100%;
		background: var(--atlas-bg);
		color: var(--atlas-ink);
		font-family: var(--atlas-ui-font);
	}
</style>
