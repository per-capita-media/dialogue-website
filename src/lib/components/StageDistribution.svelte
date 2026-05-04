<script lang="ts">
	/**
	 * Horizontal bar chart of how many students are at each stage.
	 * Pure CSS — no charting library.
	 */
	import type { StudentStage } from '$lib/types/domain';
	import { STAGE_LABEL, STAGE_TONE } from '$lib/stages';

	export let counts: Partial<Record<StudentStage, number>> = {};
	export let title: string = 'Student stages';

	$: entries = (Object.entries(counts) as [StudentStage, number][])
		.filter(([, n]) => n > 0)
		.sort(([, a], [, b]) => b - a);
	$: max = entries.reduce((m, [, n]) => Math.max(m, n), 0) || 1;

	function bar(tone: string) {
		return tone === 'success'
			? 'bg-green-500/30'
			: tone === 'warn'
				? 'bg-accent-yellow/40'
				: tone === 'info'
					? 'bg-accent-blue/30'
					: 'bg-journal-text/10 dark:bg-journal-text-dark/10';
	}
</script>

<div class="card">
	<h2 class="heading-2">{title}</h2>
	{#if entries.length === 0}
		<p class="body-text mt-2">No students yet.</p>
	{:else}
		<ul class="mt-3 space-y-2">
			{#each entries as [stage, n]}
				<li>
					<div class="flex justify-between text-xs">
						<span>{STAGE_LABEL[stage]}</span>
						<span class="meta-text">{n}</span>
					</div>
					<div class="h-2 mt-1 rounded bg-journal-border dark:bg-journal-border-dark overflow-hidden">
						<div class={`h-full ${bar(STAGE_TONE[stage])}`} style:width={`${(n / max) * 100}%`} />
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
