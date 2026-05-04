<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<div class="flex items-center justify-between">
	<h1 class="heading-1">Quizzes</h1>
	<a href="/admin/quizzes/new" class="btn-primary">+ New</a>
</div>
<div class="card mt-6 !p-0 overflow-x-auto">
	<table class="w-full text-sm">
		<thead><tr class="border-b border-journal-border dark:border-journal-border-dark text-left">
			<th class="p-3 meta-text">Type</th>
			<th class="p-3 meta-text">Title</th>
			<th class="p-3 meta-text">Pass %</th>
			<th class="p-3 meta-text">Active</th>
			<th class="p-3 meta-text"></th>
		</tr></thead>
		<tbody>
			{#each data.quizzes as q}
				<tr class="border-b border-journal-border dark:border-journal-border-dark">
					<td class="p-3">{q.type}</td>
					<td class="p-3">{q.title}</td>
					<td class="p-3">{q.pass_threshold}</td>
					<td class="p-3">{q.active ? 'yes' : 'no'}</td>
					<td class="p-3"><a class="btn-secondary text-xs" href={`/admin/quizzes/${q.id}/edit`}>Edit</a></td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
