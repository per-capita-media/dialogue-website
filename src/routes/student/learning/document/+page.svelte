<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<h1 class="heading-1">Reading material</h1>
{#if data.material}
	<div class="card mt-4">
		<h2 class="heading-2">{data.material.title}</h2>
		<p class="body-text mt-1">{data.material.description}</p>
		{#if data.signedUrl}
			<iframe title={data.material.title} src={data.signedUrl} class="w-full h-[70vh] mt-4 rounded-lg border border-journal-border dark:border-journal-border-dark" />
		{:else}
			<div class="alert-error mt-4">Document not yet uploaded by admin.</div>
		{/if}
	</div>
	<div class="mt-6">
		<a class="btn-primary" href="/student/learning/document-quiz">Take the quiz →</a>
	</div>
{:else}
	<div class="alert-error mt-6">No active reading material yet. Check back soon.</div>
{/if}
