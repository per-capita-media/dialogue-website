<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<h1 class="heading-1">All pitches</h1>
<div class="card mt-6 !p-0 overflow-x-auto">
	<table class="w-full text-sm">
		<thead><tr class="border-b border-journal-border dark:border-journal-border-dark text-left">
			<th class="p-3 meta-text">Student</th>
			<th class="p-3 meta-text">Slot</th>
			<th class="p-3 meta-text">Theme</th>
			<th class="p-3 meta-text">Title</th>
			<th class="p-3 meta-text">Status</th>
			<th class="p-3 meta-text">Article #</th>
		</tr></thead>
		<tbody>
			{#each data.pitches as p}
				<tr class="border-b border-journal-border dark:border-journal-border-dark">
					<td class="p-3">{p.student?.full_name ?? p.student?.email ?? p.student_id}</td>
					<td class="p-3">{p.slot_index}</td>
					<td class="p-3">{p.theme}</td>
					<td class="p-3">{p.title}</td>
					<td class="p-3">{p.status}</td>
					<td class="p-3">{p.article_number ?? '—'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
