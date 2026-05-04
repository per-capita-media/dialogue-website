<script lang="ts">
	import type { ActionData, PageData } from './$types';
	export let data: PageData;
	export let form: ActionData;

	const f = (k: string, fb = '') =>
		(form?.values?.[k] as string) ?? (data.pitch as any)?.[k] ?? fb;

	$: locked = data.pitch?.status === 'selected' || data.pitch?.status === 'rejected';
</script>

<a href="/student/pitches" class="meta-text underline">← All pitches</a>
<h1 class="heading-1 mt-2">Pitch slot {data.slot}</h1>
{#if locked}
	<p class="body-text mt-2">This pitch has been reviewed and is locked.</p>
{:else if data.pitch?.status === 'submitted'}
	<p class="body-text mt-2">Submitted — your supervisor will review it.</p>
{/if}

<form method="POST" class="mt-6 space-y-4">
	{#if form?.error}<div class="alert-error">{form.error}</div>{/if}
	{#if form?.saved}<div class="alert-success">Saved.</div>{/if}

	<div>
		<label class="label" for="theme">Theme</label>
		<select id="theme" name="theme" required class="input" disabled={locked}>
			<option value="" disabled selected={!f('theme')}>Pick one of your themes</option>
			{#each data.themes as t}
				<option value={t} selected={f('theme') === t}>{t}</option>
			{/each}
		</select>
	</div>
	<div>
		<label class="label" for="title">Working title</label>
		<input id="title" name="title" required class="input" disabled={locked} value={f('title')} />
	</div>
	<div>
		<label class="label" for="source_material">Source material</label>
		<textarea
			id="source_material"
			name="source_material"
			required
			rows="4"
			class="textarea"
			disabled={locked}>{f('source_material')}</textarea
		>
	</div>
	<div>
		<label class="label" for="research">Research</label>
		<textarea id="research" name="research" required rows="5" class="textarea" disabled={locked}
			>{f('research')}</textarea
		>
	</div>
	<div>
		<label class="label" for="proposal">Proposal</label>
		<textarea id="proposal" name="proposal" required rows="5" class="textarea" disabled={locked}
			>{f('proposal')}</textarea
		>
	</div>

	{#if !locked}
		<div class="flex gap-2">
			<button type="submit" formaction="?/save" class="btn-secondary">Save draft</button>
			<button type="submit" formaction="?/submit" class="btn-primary">Submit pitch</button>
		</div>
	{/if}
</form>
