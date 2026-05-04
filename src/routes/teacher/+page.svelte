<script lang="ts">
	import StageBadge from '$lib/components/StageBadge.svelte';
	import StageDistribution from '$lib/components/StageDistribution.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<div class="flex items-center justify-between flex-wrap gap-3">
	<div>
		<h1 class="heading-1">Teacher dashboard</h1>
		<p class="meta-text mt-1">Your linked students · progress only</p>
	</div>
	<a href="/teacher/messages" class="btn-secondary text-xs">Message admin</a>
</div>

{#if data.students.length === 0}
	<div class="mt-6">
		<EmptyState
			title="No linked students yet"
			description="Students appear here when an admin links them to your teacher account."
		/>
	</div>
{:else}
	<div class="grid md:grid-cols-3 gap-4 mt-6">
		<div class="card">
			<p class="meta-text">Students</p>
			<p class="heading-display mt-1">{data.students.length}</p>
		</div>
		<div class="card">
			<p class="meta-text">Schools</p>
			<p class="heading-display mt-1">{data.schoolCount}</p>
		</div>
		<div class="card">
			<p class="meta-text">View</p>
			<p class="heading-3 mt-2">Progress only</p>
			<p class="body-text mt-1 text-sm">No pitch text, article drafts, or private editor feedback.</p>
		</div>
	</div>

	<div class="mt-6">
		<StageDistribution counts={data.stageCounts} title="Where your students are" />
	</div>

	<section class="mt-8">
		<div class="flex items-center justify-between">
			<h2 class="heading-2">School roster</h2>
			<span class="meta-text">{data.students.length} total</span>
		</div>
		<div class="card mt-4 !p-0 overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-journal-border dark:border-journal-border-dark text-left">
						<th class="p-3 meta-text">Student</th>
						<th class="p-3 meta-text">School</th>
						<th class="p-3 meta-text">Year</th>
						<th class="p-3 meta-text">Stage</th>
					</tr>
				</thead>
				<tbody>
					{#each data.students as student}
						<tr class="border-b border-journal-border dark:border-journal-border-dark">
							<td class="p-3">
								<div class="font-semibold">{student.full_name ?? 'Unnamed student'}</div>
								<div class="meta-text mt-1">{student.email}</div>
							</td>
							<td class="p-3">{student.school_name ?? '—'}</td>
							<td class="p-3">{student.year_group ?? '—'}</td>
							<td class="p-3"><StageBadge stage={student.current_stage} /></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
{/if}
