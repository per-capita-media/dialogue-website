<script lang="ts">
	import type { ActionData, PageData } from './$types';
	export let data: PageData;
	export let form: ActionData;
</script>

<a href="/admin/quizzes" class="meta-text underline">← All quizzes</a>
<h1 class="heading-1 mt-2">Edit quiz</h1>

{#if form?.error}<div class="alert-error mt-4">{form.error}</div>{/if}
{#if form?.ok}<div class="alert-success mt-4">Saved.</div>{/if}

<form method="POST" action="?/updateQuiz" class="card mt-6 space-y-4">
	<input type="hidden" name="id" value={data.quiz.id} />
	<div>
		<label class="label" for="quiz_title">Title</label>
		<input id="quiz_title" name="title" required class="input" value={data.quiz.title} />
	</div>
	<div class="grid md:grid-cols-2 gap-4">
		<div>
			<label class="label" for="quiz_pass_threshold">Pass threshold (%)</label>
			<input id="quiz_pass_threshold" name="pass_threshold" type="number" min="0" max="100" class="input" value={data.quiz.pass_threshold} />
		</div>
		<label class="flex items-center gap-2 mt-6"><input type="checkbox" name="active" checked={data.quiz.active} /> active</label>
	</div>
	<button class="btn-primary">Save</button>
</form>

<section class="mt-10">
	<h2 class="heading-2">Questions ({data.questions.length})</h2>
	<div class="space-y-4 mt-4">
		{#each data.questions as q, i}
			<div class="card">
				<p class="meta-text">Q{i + 1}</p>
				<p class="font-semibold mt-1">{q.prompt}</p>
				<ol class="list-decimal pl-6 mt-2 text-sm">
					{#each q.options as opt, j}
						<li class={q.correct_index === j ? 'text-accent-blue font-semibold' : ''}>{opt}</li>
					{/each}
				</ol>
				<form method="POST" action="?/deleteQuestion" class="mt-3">
					<input type="hidden" name="id" value={q.id} />
					<button class="btn-danger text-xs">Delete</button>
				</form>
			</div>
		{/each}
	</div>

	<form method="POST" action="?/addQuestion" class="card mt-6 space-y-3">
		<h3 class="heading-3">Add a question</h3>
		<div>
			<label class="label" for="question_prompt">Prompt</label>
			<input id="question_prompt" name="prompt" required class="input" />
		</div>
		<div>
			<label class="label" for="question_options">Options (one per line)</label>
			<textarea id="question_options" name="options" required rows="4" class="textarea" placeholder="Option A&#10;Option B&#10;Option C"></textarea>
		</div>
		<div>
			<label class="label" for="question_correct_index">Correct option index (0-based)</label>
			<input id="question_correct_index" name="correct_index" type="number" min="0" required class="input" />
		</div>
		<button class="btn-primary">Add</button>
	</form>
</section>
