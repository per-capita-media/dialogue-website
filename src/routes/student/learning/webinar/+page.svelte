<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
	$: isYouTube = !!data.videoSrc && /(youtube\.com|youtu\.be)/.test(data.videoSrc);
</script>

<h1 class="heading-1">Webinar</h1>
{#if !data.material}
	<div class="alert-error mt-6">No active webinar yet.</div>
{:else}
	<div class="card mt-4">
		<h2 class="heading-2">{data.material.title}</h2>
		<p class="body-text mt-1">{data.material.description}</p>
		<div class="mt-4 aspect-video w-full overflow-hidden rounded-lg border border-journal-border dark:border-journal-border-dark">
			{#if !data.videoSrc}
				<div class="alert-error h-full flex items-center justify-center">No video available.</div>
			{:else if isYouTube}
				<iframe
					title={data.material.title}
					src={data.videoSrc}
					allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
					class="w-full h-full"
				></iframe>
			{:else}
				<video controls src={data.videoSrc} class="w-full h-full">
					<track kind="captions" />
				</video>
			{/if}
		</div>
	</div>
	<div class="mt-6">
		<a class="btn-primary" href="/student/learning/webinar-quiz">Take the quiz →</a>
	</div>
{/if}
