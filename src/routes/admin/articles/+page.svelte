<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<h1 class="heading-1">All articles</h1>
<div class="card mt-6 !p-0 overflow-x-auto">
	<table class="w-full text-sm">
		<thead><tr class="border-b border-journal-border dark:border-journal-border-dark text-left">
			<th class="p-3 meta-text">Student</th>
			<th class="p-3 meta-text">#</th>
			<th class="p-3 meta-text">Title</th>
			<th class="p-3 meta-text">Status</th>
			<th class="p-3 meta-text">Locked</th>
			<th class="p-3 meta-text">Updated</th>
		</tr></thead>
		<tbody>
			{#each data.articles as a}
				<tr class="border-b border-journal-border dark:border-journal-border-dark">
					<td class="p-3">{a.student?.full_name ?? a.student?.email ?? a.student_id}</td>
					<td class="p-3">{a.article_number}</td>
					<td class="p-3">{a.title}</td>
					<td class="p-3">{a.status}</td>
					<td class="p-3">{a.locked ? 'yes' : 'no'}</td>
					<td class="p-3">{new Date(a.updated_at).toLocaleString()}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
