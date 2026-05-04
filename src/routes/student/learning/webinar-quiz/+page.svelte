<script lang="ts">
	import QuizRunner from '$lib/components/QuizRunner.svelte';
	import type { ActionData, PageData } from './$types';
	export let data: PageData;
	export let form: ActionData;
</script>

<h1 class="heading-1">Webinar quiz</h1>
{#if !data.quiz}
	<div class="alert-error mt-6">No active webinar quiz yet.</div>
{:else}
	<p class="body-text mt-2">Pass mark: {data.quiz.pass_threshold}%. You can retry until you pass.</p>
	<div class="mt-6">
		<QuizRunner quizId={data.quiz.id} questions={data.questions} action="?/submit" lastResult={form ?? null} />
	</div>
{/if}
