<script lang="ts">
	import type { ArticleFeedback, Profile } from '$lib/types/domain';
	export let feedback: (ArticleFeedback & { author?: Pick<Profile, 'full_name' | 'role'> })[] = [];
</script>

<div class="space-y-3">
	{#if feedback.length === 0}
		<p class="meta-text">No feedback yet.</p>
	{/if}
	{#each feedback as f}
		<div class="card !p-4">
			<div class="flex items-center justify-between gap-2 mb-2">
				<span class="meta-text">
					{f.author?.full_name ?? 'Reviewer'} · {f.author?.role ?? ''}
				</span>
				<span class="meta-text">{new Date(f.created_at).toLocaleString()}</span>
			</div>
			<p class="text-sm whitespace-pre-wrap">{f.body}</p>
		</div>
	{/each}
</div>
