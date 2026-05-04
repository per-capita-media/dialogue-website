<script lang="ts">
	import StageBadge from '$lib/components/StageBadge.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<h1 class="heading-1">Students</h1>

<div class="card mt-6 overflow-x-auto !p-0">
	<table class="w-full text-sm">
		<thead class="text-left">
			<tr class="border-b border-journal-border dark:border-journal-border-dark">
				<th class="p-3 meta-text">Name</th>
				<th class="p-3 meta-text">School</th>
				<th class="p-3 meta-text">Stage</th>
				<th class="p-3 meta-text">Email</th>
			</tr>
		</thead>
		<tbody>
			{#each data.students as s}
				<tr class="border-b border-journal-border dark:border-journal-border-dark">
					<td class="p-3 font-medium">{s.full_name ?? '—'}</td>
					<td class="p-3">{s.school_name ?? '—'}</td>
					<td class="p-3"><StageBadge stage={s.current_stage} /></td>
					<td class="p-3">{s.email}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
