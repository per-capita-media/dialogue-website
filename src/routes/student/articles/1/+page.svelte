<script lang="ts">
	import FeedbackList from '$lib/components/FeedbackList.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { ActionData, PageData } from './$types';
	export let data: PageData;
	export let form: ActionData;

	$: editable = data.article && !data.article.locked && data.article.status !== 'approved';
</script>

<h1 class="heading-1">Article 1</h1>

{#if !data.article}
	<EmptyState
		title="Article 1 not yet created"
		description="Once your supervisor selects two pitches, Article 1 will appear here."
	/>
{:else}
	<p class="meta-text mt-2">Status: {data.article.status}</p>

	<form method="POST" class="mt-6 space-y-4">
		{#if form?.error}<div class="alert-error">{form.error}</div>{/if}
		{#if form?.saved}<div class="alert-success">Saved.</div>{/if}

		<div>
			<label class="label" for="title">Title</label>
			<input id="title" name="title" required class="input" disabled={!editable} value={data.article.title} />
		</div>
		<div>
			<label class="label" for="draft">Draft</label>
			<textarea id="draft" name="draft" rows="20" required class="textarea font-mono text-sm" disabled={!editable}
				>{data.article.draft}</textarea
			>
		</div>
		{#if editable}
			<div class="flex gap-2">
				<button type="submit" formaction="?/save" class="btn-secondary">Save draft</button>
				<button type="submit" formaction="?/submit" class="btn-primary">Submit for review</button>
			</div>
		{/if}
	</form>

	<section class="mt-10">
		<h2 class="heading-2 mb-3">Feedback</h2>
		<FeedbackList feedback={data.feedback} />
	</section>
{/if}
