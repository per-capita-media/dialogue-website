<script lang="ts">
	import type { PageData } from './$types';
	import NextStepPanel from '$lib/components/NextStepPanel.svelte';
	export let data: PageData;
</script>

<section class="container py-12 md:py-16">
	{#if data.profile}
		<!-- Signed-in users get a stage-aware "what to do next" panel up top.
		     The marketing cards below are kept for context. -->
		<NextStepPanel profile={data.profile} />
	{:else}
		<p class="meta-text mb-4">Dialogue · Issue 01</p>
		<h1 class="heading-1 text-3xl md:text-5xl max-w-3xl">Intro to Journalism.</h1>
		<p class="body-text mt-6 max-w-2xl text-lg">
			A private training scheme for sixth-form journalists. Read the brief, pass the quizzes,
			pitch five stories, and write two articles with a supervisor's feedback.
		</p>
		<div class="mt-10 flex gap-3 flex-wrap">
			<a class="btn-primary" href="/auth/signup">Apply as a student</a>
			<a class="btn-secondary" href="/auth/login">Sign in</a>
			<a class="btn-secondary" href="/pipeline">View full pipeline</a>
		</div>
	{/if}
</section>

<section class="container pb-20 grid md:grid-cols-3 gap-6">
	<div class="card">
		<span class="meta-text">01 — Onboard</span>
		<h2 class="heading-2 mt-2">Pick two themes</h2>
		<p class="body-text mt-2">
			You'll work within two of seven themes — from Economics to Technology and AI.
		</p>
	</div>
	<div class="card">
		<span class="meta-text">02 — Learn</span>
		<h2 class="heading-2 mt-2">Read · watch · quiz</h2>
		<p class="body-text mt-2">
			Get through the foundations: a primer document and a recorded webinar, each with a short
			quiz.
		</p>
	</div>
	<div class="card">
		<span class="meta-text">03 — Pitch & write</span>
		<h2 class="heading-2 mt-2">5 pitches → 2 articles</h2>
		<p class="body-text mt-2">
			Submit five pitches. Your supervisor selects two. Then you draft, revise and ship.
		</p>
	</div>
</section>
