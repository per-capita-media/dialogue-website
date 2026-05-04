<script lang="ts">
	import PitchCard from '$lib/components/PitchCard.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<h1 class="heading-1">Your pitches</h1>
<p class="body-text mt-2">
	Submit five pitches across your two themes — {data.themes.join(' · ')}. Your supervisor selects two
	to become Article 1 and Article 2.
</p>

<div class="grid md:grid-cols-2 gap-4 mt-8">
	{#each data.slots as { slot_index, pitch }}
		{#if pitch}
			<PitchCard {pitch} editHref={`/student/pitches/${slot_index}/edit`} />
		{:else}
			<a
				href={`/student/pitches/${slot_index}/edit`}
				class="card border-dashed flex flex-col items-center justify-center text-center min-h-[180px] hover:border-accent-blue transition-colors"
			>
				<span class="meta-text">Slot {slot_index}</span>
				<span class="heading-2 mt-1">+ Start pitch</span>
			</a>
		{/if}
	{/each}
</div>
