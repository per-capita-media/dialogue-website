<script lang="ts">
	import type { QuizQuestion } from '$lib/types/domain';
	import { enhance } from '$app/forms';

	export let questions: QuizQuestion[];
	export let quizId: string;
	export let action: string = '?/submit';
	export let lastResult: { score?: number; passed?: boolean; error?: string } | null = null;

	// chosen[questionId] = optionIndex
	let chosen: Record<string, number> = {};
	let submitting = false;

	$: complete = questions.every((q) => chosen[q.id] !== undefined);
</script>

<form
	method="POST"
	{action}
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
	class="space-y-6"
>
	<input type="hidden" name="quiz_id" value={quizId} />
	<input type="hidden" name="answers" value={JSON.stringify(chosen)} />
	{#if lastResult?.error}
		<div class="alert-error">{lastResult.error}</div>
	{/if}
	{#if lastResult && lastResult.score !== undefined}
		<div class={lastResult.passed ? 'alert-success' : 'alert-error'}>
			{lastResult.passed
				? `Passed — score ${lastResult.score}%`
				: `Not passed — score ${lastResult.score}%. Try again.`}
		</div>
	{/if}

	{#each questions as q, i}
		<fieldset class="card">
			<legend class="meta-text mb-3">Question {i + 1} of {questions.length}</legend>
			<p class="heading-3 mb-4">{q.prompt}</p>
			<div class="space-y-2">
				{#each q.options as opt, optIdx}
					<label class="flex items-start gap-3 cursor-pointer">
						<input
							type="radio"
							name={`q-${q.id}`}
							value={optIdx}
							checked={chosen[q.id] === optIdx}
							on:change={() => (chosen = { ...chosen, [q.id]: optIdx })}
							class="mt-1 accent-accent-blue"
						/>
						<span class="text-sm">{opt}</span>
					</label>
				{/each}
			</div>
		</fieldset>
	{/each}

	<button class="btn-primary" type="submit" disabled={!complete || submitting}>
		{submitting ? 'Submitting…' : 'Submit answers'}
	</button>
</form>
