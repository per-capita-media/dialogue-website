<script lang="ts">
	import type { PageData } from './$types';
	import ActionQueue from '$lib/components/ActionQueue.svelte';
	import StageDistribution from '$lib/components/StageDistribution.svelte';
	import RoleBadge from '$lib/components/RoleBadge.svelte';
	export let data: PageData;

	const items = [
		{ label: 'Students', value: data.stats.students },
		{ label: 'Editors', value: data.stats.supervisors },
		{ label: 'Pitches', value: data.stats.pitches },
		{ label: 'Articles', value: data.stats.articles },
		{ label: 'Quiz attempts', value: data.stats.attempts }
	];

	$: setupSteps = [
		{ done: data.setup.hasDocMaterial, label: 'Upload a primer document', href: '/admin/learning-materials/new' },
		{ done: data.setup.hasDocQuiz, label: 'Create a document quiz', href: '/admin/quizzes/new' },
		{ done: data.setup.hasWebMaterial, label: 'Add a webinar (file or URL)', href: '/admin/learning-materials/new' },
		{ done: data.setup.hasWebQuiz, label: 'Create a webinar quiz', href: '/admin/quizzes/new' },
		{ done: data.setup.hasSupervisor, label: 'Invite an editor', href: '/admin/invitations' },
		{ done: data.setup.hasStudent, label: 'Wait for the first student to sign up at /auth/signup', href: '/admin/students' }
	];
	$: setupIncomplete = setupSteps.filter((s) => !s.done);

	$: queueActions = [
		{
			label: 'Pitches awaiting editor selection',
			count: data.queue.pendingPitchSelect,
			href: '/admin/pitches',
			tone: 'warn' as const
		},
		{
			label: 'Articles awaiting feedback',
			count: data.queue.pendingArticleReview,
			href: '/admin/articles',
			tone: 'warn' as const
		},
		{
			label: 'Article 2s still locked',
			count: data.queue.article2Locked,
			href: '/admin/articles',
			tone: 'info' as const
		}
	].filter((a) => a.count > 0);
</script>

<div class="flex items-center justify-between flex-wrap gap-3">
	<div>
		<h1 class="heading-1">Admin dashboard</h1>
		<p class="meta-text mt-1">Programme overview · live</p>
	</div>
	<div class="flex gap-2">
		<a href="/admin/invitations" class="btn-secondary text-xs">Invite editor</a>
		<a href="/admin/learning-materials/new" class="btn-primary text-xs">+ Material</a>
	</div>
</div>

<!-- ── Headline counts ───────────────────────────────────────────────── -->
<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
	{#each items as it}
		<div class="card">
			<p class="meta-text">{it.label}</p>
			<p class="heading-display mt-1">{it.value}</p>
		</div>
	{/each}
</div>

<!-- ── Getting started (only when setup incomplete) ─────────────────── -->
{#if setupIncomplete.length > 0}
	<div class="card mt-6 border-accent-yellow/40 bg-accent-yellow/[0.06]">
		<div class="flex items-center justify-between gap-3">
			<div>
				<p class="meta-text">Getting started</p>
				<h2 class="heading-2 mt-1">Finish setting up the programme</h2>
			</div>
			<span class="badge-warn">{setupIncomplete.length} to do</span>
		</div>
		<ol class="mt-4 space-y-2">
			{#each setupSteps as s, i}
				<li class="flex items-center gap-3">
					<span
						class={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
							s.done
								? 'bg-green-500/20 text-green-700 dark:text-green-400'
								: 'bg-journal-text/10 dark:bg-journal-text-dark/10'
						}`}
					>
						{s.done ? '✓' : i + 1}
					</span>
					<span class={s.done ? 'line-through text-journal-muted dark:text-journal-muted-dark' : ''}>
						{s.label}
					</span>
					{#if !s.done}
						<a class="ml-auto btn-secondary text-xs" href={s.href}>Go →</a>
					{/if}
				</li>
			{/each}
		</ol>
	</div>
{/if}

<!-- ── Action queue + stage distribution ─────────────────────────────── -->
<div class="grid md:grid-cols-2 gap-4 mt-6">
	<ActionQueue title="Pending across the programme" actions={queueActions} />
	<StageDistribution counts={data.stageCounts} title="Where students are" />
</div>

<!-- ── Recent signups + audit log ───────────────────────────────────── -->
<div class="grid md:grid-cols-2 gap-4 mt-4">
	<div class="card">
		<div class="flex items-center justify-between">
			<h2 class="heading-2">Recent signups</h2>
			<a href="/admin/students" class="meta-text underline">All students →</a>
		</div>
		{#if data.recentSignups.length === 0}
			<p class="body-text mt-2">Nobody has signed up yet.</p>
		{:else}
			<ul class="mt-3 divide-y divide-journal-border dark:divide-journal-border-dark">
				{#each data.recentSignups as p}
					<li class="py-2 flex items-center justify-between gap-3">
						<div class="min-w-0">
							<p class="text-sm font-medium truncate">{p.full_name ?? p.email}</p>
							<p class="meta-text truncate">{p.email}</p>
						</div>
						<RoleBadge role={p.role} />
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="card">
		<div class="flex items-center justify-between">
			<h2 class="heading-2">Recent activity</h2>
			<a href="/admin/audit-log" class="meta-text underline">Audit log →</a>
		</div>
		{#if data.recentAudit.length === 0}
			<p class="body-text mt-2">No actions logged yet.</p>
		{:else}
			<ul class="mt-3 divide-y divide-journal-border dark:divide-journal-border-dark">
				{#each data.recentAudit as r}
					<li class="py-2">
						<div class="flex items-center justify-between gap-3">
							<span class="text-sm font-mono">{r.action}</span>
							<span class="meta-text">{new Date(r.created_at).toLocaleTimeString()}</span>
						</div>
						<p class="meta-text mt-0.5">
							{r.actor?.full_name ?? 'system'}{r.target_table ? ` · ${r.target_table}` : ''}
						</p>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
