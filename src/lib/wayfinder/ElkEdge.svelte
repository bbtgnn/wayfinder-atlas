<script lang="ts">
	import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/svelte'

	type ElkEdgeData = {
		points?: { x: number; y: number }[]
	}

	let {
		id,
		data,
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
		style,
		markerEnd,
		markerStart,
		interactionWidth,
		label,
		labelStyle
	}: EdgeProps = $props()

	const path = $derived.by(() => {
		const points = (data as ElkEdgeData | undefined)?.points
		if (points && points.length >= 2) {
			return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')
		}
		const [smoothPath] = getSmoothStepPath({
			sourceX,
			sourceY,
			targetX,
			targetY,
			sourcePosition,
			targetPosition
		})
		return smoothPath
	})
</script>

<BaseEdge
	{id}
	{path}
	{style}
	{markerEnd}
	{markerStart}
	{interactionWidth}
	{label}
	{labelStyle}
/>
