<script lang="ts">
	import WayfinderView from '#lib/wayfinder/WayfinderView.svelte'
	import type { PageProps } from './$types'

	let { data }: PageProps = $props()
</script>

<WayfinderView projections={data.projections} initialEffort={data.initialEffort} />
