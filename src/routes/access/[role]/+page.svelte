<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<section class="container max-w-4xl py-12 md:py-16">
	<a href="/" class="meta-text underline">Dialogue home</a>
	<p class="meta-text mt-8">{data.eyebrow}</p>
	<h1 class="heading-display mt-3 max-w-3xl">{data.label}</h1>
	<div class="divider-thick mt-6"></div>
	<h2 class="heading-2 mt-8">{data.title}</h2>
	<p class="body-text mt-4 max-w-3xl text-lg">{data.body}</p>

	<div class="mt-8 flex flex-wrap gap-3">
		<a href={data.primaryHref} class="btn-primary">{data.primaryLabel}</a>
		<a href={data.secondaryHref} class="btn-secondary">{data.secondaryLabel}</a>
	</div>

	<div class="mt-12 grid gap-4 md:grid-cols-3">
		{#each data.notes as note}
			<div class="border-t-2 border-journal-text dark:border-journal-text-dark pt-4">
				<p class="heading-3">{note}</p>
			</div>
		{/each}
	</div>
</section>
