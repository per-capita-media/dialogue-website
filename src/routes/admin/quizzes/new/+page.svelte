<script lang="ts">
	import type { ActionData } from './$types';
	export let form: ActionData;
</script>

<a href="/admin/quizzes" class="meta-text underline">← All quizzes</a>
<h1 class="heading-1 mt-2">New quiz</h1>
<form method="POST" class="card mt-6 space-y-4">
	{#if form?.error}<div class="alert-error">{form.error}</div>{/if}
	<div>
		<label class="label" for="quiz_type">Type</label>
		<select id="quiz_type" name="type" class="input">
			<option value="document">document</option>
			<option value="webinar">webinar</option>
		</select>
	</div>
	<div>
		<label class="label" for="quiz_title">Title</label>
		<input id="quiz_title" name="title" required class="input" />
	</div>
	<div>
		<label class="label" for="quiz_pass_threshold">Pass threshold (%)</label>
		<input id="quiz_pass_threshold" name="pass_threshold" type="number" min="0" max="100" value="70" class="input" />
	</div>
	<button class="btn-primary">Create & add questions</button>
</form>
