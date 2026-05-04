<script lang="ts">
	import StageBadge from '$lib/components/StageBadge.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import ActionQueue from '$lib/components/ActionQueue.svelte';
	import StageDistribution from '$lib/components/StageDistribution.svelte';
	import type { PageData } from './$types';
	export let data: PageData;

	$: queueActions = [
		...data.queue.pitchSelectStudents.map((s) => ({
			label: `Select 2 pitches for ${s.full_name ?? 'student'}`,
			href: `/editor/students/${s.id}/pitches`,
			tone: 'warn' as const
		})),
		...data.queue.articleReviewItems.map((a) => ({
			label: `Review Article ${a.article_number} from ${a.student_name ?? 'student'} (${a.status})`,
			href: `/editor/students/${a.student_id}/articles/${a.article_number}`,
			tone: 'warn' as const
		})),
		...data.queue.article2Ready.map((a) => ({
			label: `Unlock Article 2 for ${a.student_name ?? 'student'}`,
			href: `/editor/students/${a.student_id}/articles/2`,
			tone: 'info' as const
		}))
	];

	$: messageBadge = data.unreadCount > 0 ? `${data.unreadCount} new` : 'open inbox';
</script>

<div class="flex items-center justify-between flex-wrap gap-3">
	<div>
		<h1 class="heading-1">Editor dashboard</h1>
		<p class="meta-text mt-1">Your assigned students · live</p>
	</div>
	<a href="/editor/messages" class="btn-secondary text-xs">
		Messages · {messageBadge}
	</a>
</div>

{#if data.students.length === 0}
	<div class="mt-6">
		<EmptyState
			title="No students assigned yet"
			description="An admin will assign students to you. You'll see them here when they're added."
		/>
	</div>
{:else}
	<!-- ── Action queue + stage distribution ──────────────────────── -->
	<div class="grid md:grid-cols-2 gap-4 mt-6">
		<ActionQueue title="Pending actions" actions={queueActions} />
		<StageDistribution counts={data.stageCounts} title="Where your students are" />
	</div>

	<!-- ── Headline counts ───────────────────────────────────────── -->
	<div class="grid grid-cols-3 gap-4 mt-6">
		<div class="card">
			<p class="meta-text">Students</p>
			<p class="heading-display mt-1">{data.students.length}</p>
		</div>
		<div class="card">
			<p class="meta-text">Open reviews</p>
			<p class="heading-display mt-1">
				{data.queue.articleReviewItems.length + data.queue.pitchSelectStudents.length}
			</p>
		</div>
		<div class="card">
			<p class="meta-text">Article 2s ready</p>
			<p class="heading-display mt-1">{data.queue.article2Ready.length}</p>
		</div>
	</div>

	<!-- ── Student roster ────────────────────────────────────────── -->
	<section class="mt-8">
		<div class="flex items-center justify-between">
			<h2 class="heading-2">Your students</h2>
			<span class="meta-text">{data.students.length} total</span>
		</div>
		<div class="grid md:grid-cols-2 gap-3 mt-4">
			{#each data.students as s}
				<a
					href={`/editor/students/${s.id}`}
					class="card hover:border-accent-blue transition-colors"
				>
					<div class="flex items-start justify-between gap-2">
						<div class="min-w-0">
							<h3 class="heading-3 truncate">{s.full_name ?? 'Unnamed student'}</h3>
							<p class="meta-text mt-1 truncate">{s.school_name ?? '—'} · {s.email}</p>
						</div>
						<StageBadge stage={s.current_stage} />
					</div>
				</a>
			{/each}
		</div>
	</section>
{/if}
