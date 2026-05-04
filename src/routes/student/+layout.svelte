<script lang="ts">
	import { page } from '$app/stores';
	import StageBadge from '$lib/components/StageBadge.svelte';
	import { nextStepFor } from '$lib/stages';
	import type { LayoutData } from './$types';
	export let data: LayoutData;

	$: nextStep = nextStepFor(data.profile);

	const links = [
		{ href: '/student', label: 'Dashboard' },
		{ href: '/student/learning/document', label: 'Learning' },
		{ href: '/student/pitches', label: 'Pitches' },
		{ href: '/student/articles/1', label: 'Article 1' },
		{ href: '/student/articles/2', label: 'Article 2' },
		{ href: '/student/messages', label: 'Messages' }
	];
	$: active = (h: string) =>
		h === '/student' ? $page.url.pathname === h : $page.url.pathname.startsWith(h);
</script>

<div class="container py-8 grid md:grid-cols-[220px_1fr] gap-8">
	<aside class="md:sticky md:top-20 self-start">
		<div class="card !p-4">
			<p class="meta-text">{data.profile.full_name ?? 'Student'}</p>
			<div class="mt-2"><StageBadge stage={data.profile.current_stage} /></div>
			<a href={nextStep.href} class="block mt-3 text-xs text-accent-blue hover:underline">
				Next: {nextStep.headline} →
			</a>
		</div>
		<nav class="mt-4 flex flex-col gap-1">
			{#each links as l}
				<a
					href={l.href}
					class={`px-3 py-2 rounded-md text-sm transition-colors ${
						active(l.href)
							? 'bg-accent-blue/10 text-accent-blue'
							: 'hover:bg-journal-text/5 dark:hover:bg-journal-text-dark/5'
					}`}>{l.label}</a
				>
			{/each}
		</nav>
	</aside>
	<section><slot /></section>
</div>
