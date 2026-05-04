<script lang="ts">
	import type { ActionData, PageData } from './$types';
	export let data: PageData;
	export let form: ActionData;

	let selected: Record<string, Set<string>> = {};
	for (const s of data.students) {
		selected[s.id] = new Set(data.themesByStudent[s.id] ?? []);
	}

	function toggle(studentId: string, theme: string) {
		const s = selected[studentId];
		if (s.has(theme)) s.delete(theme);
		else if (s.size < 2) s.add(theme);
		selected = { ...selected };
	}
</script>

<h1 class="heading-1">Override student themes</h1>
<p class="body-text mt-2">Pick exactly 2 themes per student. Overrides replace the student's current theme selection.</p>

{#if form?.error}<div class="alert-error mt-4">{form.error}</div>{/if}
{#if form?.ok}<div class="alert-success mt-4">Saved.</div>{/if}

<div class="space-y-8 mt-6">
	{#each data.students as s}
		<form method="POST" action="?/override" class="card">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="heading-2">{s.full_name ?? s.email}</h3>
					<p class="meta-text">{s.email}</p>
				</div>
				<button class="btn-primary" disabled={selected[s.id].size !== 2}>Apply</button>
			</div>
			<input type="hidden" name="student_id" value={s.id} />
			{#each [...selected[s.id]] as t}
				<input type="hidden" name="themes" value={t} />
			{/each}
			<div class="mt-4 grid sm:grid-cols-2 gap-2">
				{#each data.all as t}
					{@const on = selected[s.id].has(t)}
					<button
						type="button"
						on:click={() => toggle(s.id, t)}
						class={`text-left p-3 rounded-lg border text-sm transition-all ${on ? 'border-accent-blue bg-accent-blue/5' : 'border-journal-border dark:border-journal-border-dark'}`}
					>
						{on ? '✓ ' : ''}{t}
					</button>
				{/each}
			</div>
		</form>
	{/each}
</div>
