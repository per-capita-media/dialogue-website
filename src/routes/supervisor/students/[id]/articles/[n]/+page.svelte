<script lang="ts">
	import FeedbackList from '$lib/components/FeedbackList.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { ActionData, PageData } from './$types';
	export let data: PageData;
	export let form: ActionData;
</script>

<a href={`/supervisor/students/${data.studentId}`} class="meta-text underline">← Back to student</a>
<h1 class="heading-1 mt-2">Article {data.articleNumber}</h1>

{#if !data.article}
	<EmptyState title="No article yet" description="The student needs to have pitches selected first." />
{:else}
	<p class="meta-text mt-2">Status: {data.article.status} · {data.article.locked ? 'locked' : 'unlocked'}</p>
	{#if data.article.locked}
		<form method="POST" action="?/unlock" class="mt-4">
			<input type="hidden" name="article_id" value={data.article.id} />
			<button class="btn-primary">Unlock article</button>
		</form>
	{/if}

	<section class="mt-6">
		<h2 class="heading-2">Pitch this is based on</h2>
		<div class="card mt-2">
			<p class="meta-text">{data.pitch?.theme}</p>
			<h3 class="heading-2 mt-1">{data.pitch?.title}</h3>
			<p class="body-text mt-2 whitespace-pre-wrap">{data.pitch?.proposal}</p>
		</div>
	</section>

	<section class="mt-6">
		<h2 class="heading-2">Draft</h2>
		<div class="card mt-2 whitespace-pre-wrap text-sm">
			{data.article.draft || '(no draft yet)'}
		</div>
	</section>

	<section class="mt-6">
		<h2 class="heading-2 mb-3">Feedback</h2>
		<FeedbackList feedback={data.feedback} />
		<form method="POST" action="?/feedback" class="mt-4 space-y-3">
			{#if form?.error}<div class="alert-error">{form.error}</div>{/if}
			<input type="hidden" name="article_id" value={data.article.id} />
			<textarea name="body" rows="4" required class="textarea" placeholder="Leave constructive feedback…" />
			<button class="btn-primary" type="submit">Post feedback</button>
		</form>
	</section>

	<section class="mt-6 flex flex-wrap gap-2">
		<form method="POST" action="?/status">
			<input type="hidden" name="article_id" value={data.article.id} />
			<input type="hidden" name="status" value="under_review" />
			<button class="btn-secondary">Mark under review</button>
		</form>
		<form method="POST" action="?/status">
			<input type="hidden" name="article_id" value={data.article.id} />
			<input type="hidden" name="status" value="revision_requested" />
			<button class="btn-secondary">Request revision</button>
		</form>
		<form method="POST" action="?/status">
			<input type="hidden" name="article_id" value={data.article.id} />
			<input type="hidden" name="status" value="approved" />
			<button class="btn-primary">Approve</button>
		</form>
	</section>
{/if}
