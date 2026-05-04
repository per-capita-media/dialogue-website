<script lang="ts">
	import type { ActionData, PageData } from './$types';
	export let data: PageData;
	export let form: ActionData;

	$: v = (k: string, fallback = '') => (form?.values?.[k] as string) ?? (data.profile as any)?.[k] ?? fallback;
</script>

<h1 class="heading-1">Tell us about yourself</h1>
<p class="body-text mt-2">All fields are required. Used only by your editor, teacher contact, and the programme team.</p>

<form method="POST" class="mt-8 space-y-4">
	{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

	<div>
		<label class="label" for="full_name">Full name</label>
		<input id="full_name" name="full_name" required class="input" value={v('full_name')} />
	</div>
	<div class="grid md:grid-cols-2 gap-4">
		<div>
			<label class="label" for="school_name">School</label>
			<input id="school_name" name="school_name" required class="input" value={v('school_name')} />
		</div>
		<div>
			<label class="label" for="year_group">Year group</label>
			<input id="year_group" name="year_group" required class="input" value={v('year_group', 'Year 12')} />
		</div>
	</div>
	<div>
		<label class="label" for="email">Your email</label>
		<input id="email" name="email" type="email" required class="input" value={v('email', data.profile?.email ?? '')} />
	</div>
	<div class="grid md:grid-cols-2 gap-4">
		<div>
			<label class="label" for="teacher_name">Teacher contact name</label>
			<input id="teacher_name" name="teacher_name" required class="input" value={v('teacher_name')} />
		</div>
		<div>
			<label class="label" for="teacher_email">Teacher email</label>
			<input id="teacher_email" name="teacher_email" type="email" required class="input" value={v('teacher_email')} />
		</div>
	</div>
	<button type="submit" class="btn-primary w-full">Continue → choose themes</button>
</form>
