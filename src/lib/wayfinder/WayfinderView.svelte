<script lang="ts">
	import { untrack } from 'svelte'
	import {
		SvelteFlow,
		Background,
		Controls,
		MiniMap,
		BackgroundVariant,
		type Edge,
		type EdgeTypes,
		type NodeTypes
	} from '@xyflow/svelte'
	import '@xyflow/svelte/dist/style.css'

	import type { EffortProjection, Ticket } from '../../projection/types'
	import ElkEdge from './ElkEdge.svelte'
	import { flowFromProjection } from './flow-from-projection'
	import {
		resolveLayoutRecipe,
		persistLayoutRecipe,
		recipeEquals,
		DEFAULT_RECIPE,
		type LayoutRecipe
	} from './layout-recipe'
	import TicketNode from './TicketNode.svelte'
	import type { TicketFlowNode } from './types'

	type Props = {
		projections: Record<string, EffortProjection>
		initialEffort: string
	}

	let { projections, initialEffort }: Props = $props()

	let layoutRecipe = $state<LayoutRecipe>(resolveLayoutRecipe())
	const nodeTypes: NodeTypes = { ticket: TicketNode }
	const edgeTypes: EdgeTypes = { elk: ElkEdge }

	const available = $derived(Object.keys(projections).sort())
	const isDefault = $derived(recipeEquals(layoutRecipe, DEFAULT_RECIPE))

	// Fixture toggle owns effort; prop is only the first paint default.
	let effort = $state(untrack(() => initialEffort))
	let selected = $state<Ticket | null>(null)

	const projection = $derived(projections[effort]!)
	const mapSections = $derived(
		projection.map.sections.filter((s) =>
			['destination', 'notes', 'decisions', 'fog', 'outOfScope'].includes(s.id)
		)
	)

	// Flow needs bindable arrays; reassign on fixture switch (not deep-mutate).
	let nodes = $state.raw<TicketFlowNode[]>([])
	let edges = $state.raw<Edge[]>([])

	async function applyProjection(proj: EffortProjection) {
		const flow = await flowFromProjection(proj, layoutRecipe)
		nodes = flow.nodes
		edges = flow.edges
		selected = null
	}

	async function setRecipe(next: LayoutRecipe) {
		layoutRecipe = next
		persistLayoutRecipe(layoutRecipe)
		await applyProjection(projections[effort]!)
	}

	async function patchRecipe(patch: Partial<LayoutRecipe>) {
		await setRecipe({ ...layoutRecipe, ...patch })
	}

	void applyProjection(untrack(() => projections[effort]!))

	async function switchEffort(next: string) {
		if (next === effort || !projections[next]) return
		effort = next
		await applyProjection(projections[next])
	}

	function onnodeclick({ node }: { node: TicketFlowNode }) {
		selected = node.data.ticket
	}

	let layoutDialog: HTMLDialogElement | undefined

	function layoutDialogAttach(node: HTMLDialogElement) {
		layoutDialog = node
		return () => {
			layoutDialog = undefined
		}
	}

	function openLayoutDialog() {
		layoutDialog?.showModal()
	}

	function onLayoutDialogClick(e: MouseEvent) {
		if (e.target === layoutDialog) layoutDialog?.close()
	}
</script>

<div class="shell">
	<header>
		<strong>Atlas wayfinder</strong>
		<span class="hint"
			>nodes = tickets · edges = Blocked by · map = prose · layout={layoutRecipe.engine}</span
		>

		<button type="button" onclick={openLayoutDialog}>Layout…</button>

		<dialog
			{@attach layoutDialogAttach}
			class="layout-dialog"
			onclick={onLayoutDialogClick}
		>
			<form method="dialog" class="layout-controls">
				<strong>Layout</strong>
				{#if !isDefault}
					<button type="button" onclick={() => setRecipe({ ...DEFAULT_RECIPE })}>
						Reset default
					</button>
				{/if}
				<label>
					engine
					<select
						value={layoutRecipe.engine}
						onchange={(e) =>
							patchRecipe({
								engine: e.currentTarget.value === 'elk' ? 'elk' : 'dagre'
							})}
					>
						<option value="dagre">dagre</option>
						<option value="elk">elk</option>
					</select>
				</label>
				<label>
					<input
						type="checkbox"
						checked={layoutRecipe.packComponentsX}
						onchange={(e) => patchRecipe({ packComponentsX: e.currentTarget.checked })}
					/>
					Pack components X
				</label>
				{#if layoutRecipe.engine === 'elk'}
					<label>
						<input
							type="checkbox"
							checked={layoutRecipe.elkEdgePost}
							onchange={(e) => patchRecipe({ elkEdgePost: e.currentTarget.checked })}
						/>
						Edge post-route
					</label>
					{#if layoutRecipe.elkEdgePost}
						<label class="sub">
							<input
								type="checkbox"
								checked={layoutRecipe.elkSeparateLanes}
								onchange={(e) =>
									patchRecipe({ elkSeparateLanes: e.currentTarget.checked })}
							/>
							Separate lanes
						</label>
					{/if}
				{/if}
				<button value="close">Close</button>
			</form>
		</dialog>

		{#if available.length > 1}
			<label class="fixture">
				fixture
				<select
					value={effort}
					onchange={(e) => switchEffort(e.currentTarget.value)}
				>
					{#each available as id (id)}
						<option value={id}>{id}</option>
					{/each}
				</select>
			</label>
		{/if}
	</header>

	<aside class="map-panel">
		<h1>{projection.map.title}</h1>
		{#if projection.map.label}
			<p class="label">{projection.map.label}</p>
		{/if}
		{#each mapSections as section (section.id)}
			<section>
				<h2>{section.heading}</h2>
				<pre class="prose">{section.body}</pre>
			</section>
		{/each}
	</aside>

	<main class="flow">
		{#key effort}
			<SvelteFlow
				bind:nodes
				bind:edges
				{nodeTypes}
				{edgeTypes}
				fitView
				nodesDraggable={false}
				nodesConnectable={false}
				elementsSelectable={true}
				{onnodeclick}
			>
				<Background variant={BackgroundVariant.Dots} gap={16} size={1} />
				<Controls />
				<MiniMap />
			</SvelteFlow>
		{/key}
	</main>

	<aside class="gist">
		{#if selected}
			<h2>
				{String(selected.ticketNumber).padStart(2, '0')} — {selected.title}
			</h2>
			<p class="meta">{selected.type} · {selected.status}</p>
			{#if selected.answerGist}
				<p class="answer"><strong>Answer gist:</strong> {selected.answerGist}</p>
			{:else}
				<p class="muted">No ## Answer yet — question body excerpt:</p>
				<pre class="prose">{selected.body.slice(0, 600)}{selected.body.length > 600
						? '…'
						: ''}</pre>
				{#if selected.body.length > 600}
					<p class="muted">Truncated at 600 chars (full body not shown).</p>
				{/if}
			{/if}
		{:else}
			<p class="muted">Click a ticket for Answer gist (plain text; no markdown render in S1).</p>
			<p class="stats">
				{projection.tickets.length} tickets · {projection.edges.length} edges · frontier
				{projection.frontier.length}
			</p>
		{/if}
	</aside>
</div>

<style>
	.shell {
		display: grid;
		grid-template-columns: minmax(220px, 280px) 1fr minmax(220px, 300px);
		grid-template-rows: auto 1fr;
		height: 100vh;
		gap: 0;
		font-family: var(--atlas-ui-font);
	}

	header {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		padding: 0.65rem 1rem;
		border-bottom: 1px solid var(--atlas-line);
		background: var(--atlas-panel);
	}

	.hint {
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.layout-dialog {
		padding: 0;
		border: 1px solid var(--atlas-line);
		background: var(--atlas-panel);
		font-family: var(--atlas-ui-font);
		max-width: min(20rem, 90vw);
	}

	.layout-dialog::backdrop {
		background: rgba(0, 0, 0, 0.35);
	}

	.layout-controls {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
	}

	label {
		font-size: 0.85rem;
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}

	label.sub {
		margin-left: 0.5rem;
		opacity: 0.92;
	}

	.fixture {
		margin-left: auto;
	}

	.map-panel,
	.gist {
		overflow: auto;
		padding: 1rem;
		border-right: 1px solid var(--atlas-line);
		background: var(--atlas-panel);
	}

	.gist {
		border-right: none;
		border-left: 1px solid var(--atlas-line);
	}

	.flow {
		min-height: 0;
		height: 100%;
	}

	h1 {
		font-size: 1.05rem;
		margin: 0 0 0.5rem;
	}

	h2 {
		font-size: 0.85rem;
		margin: 1rem 0 0.35rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.label {
		font-size: 0.75rem;
		opacity: 0.7;
		margin: 0;
	}

	.prose {
		white-space: pre-wrap;
		font: inherit;
		font-size: 0.78rem;
		margin: 0;
		opacity: 0.9;
	}

	.muted {
		opacity: 0.65;
		font-size: 0.85rem;
	}

	.meta {
		font-size: 0.8rem;
		opacity: 0.75;
	}

	.answer {
		font-size: 0.88rem;
		line-height: 1.4;
	}

	.stats {
		font-size: 0.8rem;
	}
</style>
