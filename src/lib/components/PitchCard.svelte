<script lang="ts">
	import type { Pitch } from '$lib/types/domain';
	export let pitch: Pitch;
	export let editHref: string | null = null;
</script>

<div class="card flex flex-col gap-2">
	<div class="flex items-center justify-between gap-2">
		<span class="meta-text">Slot {pitch.slot_index} · {pitch.theme}</span>
		<span
			class={pitch.status === 'selected'
				? 'badge-success'
				: pitch.status === 'rejected'
					? 'badge-danger'
					: pitch.status === 'submitted'
						? 'badge-info'
						: 'badge-warn'}
		>
			{pitch.status}
		</span>
	</div>
	<h3 class="heading-2">{pitch.title || 'Untitled pitch'}</h3>
	{#if pitch.proposal}
		<p class="body-text line-clamp-3">{pitch.proposal}</p>
	{/if}
	{#if editHref}
		<div class="pt-2">
			<a class="btn-secondary text-xs" href={editHref}>Open</a>
		</div>
	{/if}
</div>
