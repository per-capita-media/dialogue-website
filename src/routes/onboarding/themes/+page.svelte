<script lang="ts">
	import type { ActionData, PageData } from './$types';
	export let data: PageData;
	export let form: ActionData;

	let chosen = new Set<string>(form?.themes ?? data.chosen ?? []);

	function toggle(t: string) {
		const next = new Set(chosen);
		if (next.has(t)) next.delete(t);
		else if (next.size < 2) next.add(t);
		chosen = next;
	}
</script>

<h1 class="heading-1">Choose 2 themes</h1>
<p class="body-text mt-2">
	All five of your pitches must use one of these two themes. Once you continue, your themes are
	locked. (An admin can override later if you really need to switch.)
</p>

<form method="POST" class="mt-8 space-y-4">
	{#each [...chosen] as t}
		<input type="hidden" name="themes" value={t} />
	{/each}
	{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

	<div class="grid sm:grid-cols-2 gap-3">
		{#each data.all as t}
			{@const isOn = chosen.has(t)}
			<button
				type="button"
				on:click={() => toggle(t)}
				class={`text-left p-4 rounded-lg border transition-all ${
					isOn
						? 'border-accent-blue bg-accent-blue/5'
						: 'border-journal-border dark:border-journal-border-dark hover:border-journal-text/30'
				}`}
				disabled={!isOn && chosen.size >= 2}
			>
				<span class="meta-text block mb-1">{isOn ? 'Selected' : 'Available'}</span>
				<span class="text-sm font-semibold">{t}</span>
			</button>
		{/each}
	</div>

	<button type="submit" class="btn-primary w-full" disabled={chosen.size !== 2}>
		Lock my 2 themes & continue
	</button>
</form>
