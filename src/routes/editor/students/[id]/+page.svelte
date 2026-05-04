<script lang="ts">
	import StageBadge from '$lib/components/StageBadge.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<a href="/editor" class="meta-text underline">← All students</a>
<div class="flex items-center justify-between mt-2 flex-wrap gap-2">
	<h1 class="heading-1">{data.student.full_name ?? 'Student'}</h1>
	<StageBadge stage={data.student.current_stage} />
</div>
<p class="meta-text mt-2">{data.student.email} · {data.student.school_name ?? ''}</p>
<p class="body-text mt-1">Themes: {data.themes.join(' · ') || '—'}</p>

<div class="grid md:grid-cols-3 gap-4 mt-6">
	<a href={`/editor/students/${data.student.id}/pitches`} class="card hover:border-accent-blue transition-colors">
		<h3 class="heading-2">Pitches</h3>
		<p class="body-text mt-1">{data.pitches.length}/5 slots filled</p>
	</a>
	<a href={`/editor/students/${data.student.id}/articles/1`} class="card hover:border-accent-blue transition-colors">
		<h3 class="heading-2">Article 1</h3>
		<p class="body-text mt-1">{data.articles.find((a) => a.article_number === 1)?.status ?? 'not yet started'}</p>
	</a>
	<a href={`/editor/students/${data.student.id}/articles/2`} class="card hover:border-accent-blue transition-colors">
		<h3 class="heading-2">Article 2</h3>
		<p class="body-text mt-1">
			{#if !data.articles.find((a) => a.article_number === 2)}not yet started{:else if data.articles.find((a) => a.article_number === 2)?.locked}locked{:else}{data.articles.find((a) => a.article_number === 2)?.status}{/if}
		</p>
	</a>
</div>
