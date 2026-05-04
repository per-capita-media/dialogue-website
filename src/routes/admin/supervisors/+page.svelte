<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<h1 class="heading-1">Editors</h1>
<p class="body-text mt-2">Editors review assigned students. Legacy supervisor accounts are shown here as editor-equivalent staff.</p>

<div class="card mt-6 overflow-x-auto !p-0">
	<table class="w-full text-sm">
		<thead><tr class="border-b border-journal-border dark:border-journal-border-dark text-left">
			<th class="p-3 meta-text">Name</th>
			<th class="p-3 meta-text">Email</th>
			<th class="p-3 meta-text">Role</th>
			<th class="p-3 meta-text">Students assigned</th>
		</tr></thead>
		<tbody>
			{#each data.supervisors as s}
				<tr class="border-b border-journal-border dark:border-journal-border-dark">
					<td class="p-3">{s.full_name ?? '—'}</td>
					<td class="p-3">{s.email}</td>
					<td class="p-3">{s.role}</td>
					<td class="p-3">{s.student_count}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
