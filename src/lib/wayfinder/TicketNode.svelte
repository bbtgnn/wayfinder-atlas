<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte'
	import { ticketTypeVisual } from './ticket-type'
	import type { TicketFlowNode } from './types'

	let { data, selected = false }: NodeProps<TicketFlowNode> = $props()

	const ticket = $derived(data.ticket)
	const typeVisual = $derived(ticketTypeVisual(ticket.type))
	const status = $derived(ticket.status)
</script>

<div
	class={[
		'ticket',
		{
			frontier: data.frontier,
			blocked: data.blocked && status !== 'resolved',
			resolved: status === 'resolved',
			selected
		}
	]}
	style:--type-color={typeVisual.color}
>
	<Handle type="target" position={Position.Top} />
	<div class="meta">
		<span class="type">
			<svg class="type-icon" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
				<path d={typeVisual.iconPath} fill="currentColor" />
			</svg>
			{typeVisual.label}
		</span>
		<span class={['status-chip', status]}>{status}</span>
	</div>
	<div class="title-row">
		<span class="num">{String(ticket.ticketNumber).padStart(2, '0')}</span>
		<div class="title">{ticket.title}</div>
	</div>
	{#if data.frontier}
		<div class="badge">frontier</div>
	{/if}
	<Handle type="source" position={Position.Bottom} />
</div>

<style>
	.ticket {
		width: 220px;
		min-height: 100px;
		box-sizing: border-box;
		padding: 0.55rem 0.65rem 0.5rem;
		border: 1.5px solid var(--atlas-line);
		border-top: 3px solid var(--type-color);
		border-radius: 4px;
		background: var(--atlas-panel);
		font-size: 0.78rem;
		line-height: 1.25;
		font-family: var(--atlas-ui-font);
		transition: box-shadow 0.12s ease;
	}

	/* Hover / select rings sit above frontier cue so click focus stays readable. */
	.ticket:hover {
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--atlas-ink) 28%, transparent);
	}

	.ticket.selected,
	.ticket.selected:hover {
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--atlas-ink) 58%, transparent);
	}

	.frontier:not(.selected):not(:hover) {
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--atlas-frontier) 35%, transparent);
	}

	.blocked {
		opacity: 0.85;
	}

	.resolved {
		opacity: 0.72;
	}

	.meta {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
		align-items: center;
		margin-bottom: 0.3rem;
		font-size: 0.68rem;
		letter-spacing: 0.04em;
	}

	.type {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		color: var(--type-color);
		text-transform: uppercase;
		font-weight: 600;
	}

	.type-icon {
		flex-shrink: 0;
		display: block;
	}

	.status-chip {
		margin-left: auto;
		padding: 0.1rem 0.4rem;
		border-radius: 999px;
		font-size: 0.62rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		line-height: 1.3;
	}

	.status-chip.open {
		color: var(--atlas-open);
		background: color-mix(in srgb, var(--atlas-open) 14%, transparent);
	}

	.status-chip.claimed {
		color: var(--atlas-claimed);
		background: color-mix(in srgb, var(--atlas-claimed) 16%, transparent);
	}

	.status-chip.resolved {
		color: var(--atlas-resolved);
		background: color-mix(in srgb, var(--atlas-resolved) 14%, transparent);
	}

	.title-row {
		display: flex;
		align-items: flex-start;
		gap: 0.4rem;
	}

	.num {
		flex-shrink: 0;
		margin-top: 0.05rem;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		font-size: 0.78rem;
		opacity: 0.55;
		letter-spacing: 0.02em;
	}

	.title {
		font-weight: 600;
		font-size: 0.82rem;
		min-width: 0;
	}

	.badge {
		margin-top: 0.3rem;
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--atlas-frontier);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
</style>
