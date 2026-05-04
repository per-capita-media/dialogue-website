<script lang="ts">
	import type { ActionData, PageData } from './$types';
	export let data: PageData;
	export let form: ActionData;

	let chosen = new Set<string>(data.pitches.filter((p) => p.status === 'selected').map((p) => p.id));
	function toggle(id: string) {
		const n = new Set(chosen);
		if (n.has(id)) n.delete(id);
		else if (n.size < 2) n.add(id);
		chosen = n;
	}

	$: alreadyDecided = data.pitches.some((p) => p.status === 'selected' || p.status === 'rejected');
	$: submittedCount = data.pitches.filter((p) => p.status !== 'draft').length;
</script>

<a href={`/supervisor/students/${data.studentId}`} class="meta-text underline">← Back to student</a>
<h1 class="heading-1 mt-2">Review pitches</h1>
{#if submittedCount < 5}
	<p class="body-text mt-2">{submittedCount}/5 pitches submitted. You can review once all 5 are in.</p>
{:else if alreadyDecided}
	<p class="body-text mt-2">Selection already made. View only.</p>
{:else}
	<p class="body-text mt-2">Select exactly two pitches — they become Article 1 (lower slot) and Article 2.</p>
{/if}

<form method="POST" action="?/select" class="mt-6">
	{#if form?.error}<div class="alert-error mb-4">{form.error}</div>{/if}

	<div class="grid md:grid-cols-2 gap-4">
		{#each data.pitches as p}
			{@const isOn = chosen.has(p.id)}
			<label class={`card cursor-pointer transition-colors ${isOn ? 'border-accent-blue' : ''}`}>
				<div class="flex items-center justify-between gap-2">
					<span class="meta-text">Slot {p.slot_index} · {p.theme}</span>
					<input
						type="checkbox"
						name="selected"
						value={p.id}
						checked={isOn}
						on:change={() => toggle(p.id)}
						disabled={alreadyDecided || (!isOn && chosen.size >= 2)}
						class="accent-accent-blue w-4 h-4"
					/>
				</div>
				<h3 class="heading-2 mt-2">{p.title}</h3>
				<p class="body-text mt-2 line-clamp-3">{p.proposal}</p>
			</label>
		{/each}
	</div>

	{#if !alreadyDecided && submittedCount === 5}
		<div class="mt-6">
			<button type="submit" class="btn-primary" disabled={chosen.size !== 2}>
				Confirm — these two become Article 1 & 2
			</button>
		</div>
	{/if}
</form>
