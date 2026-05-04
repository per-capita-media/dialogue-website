<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<h1 class="heading-1">Audit log</h1>
<p class="body-text mt-2">Last 200 admin / supervisor actions.</p>

<div class="card mt-6 !p-0 overflow-x-auto">
	<table class="w-full text-sm">
		<thead><tr class="border-b border-journal-border dark:border-journal-border-dark text-left">
			<th class="p-3 meta-text">Time</th>
			<th class="p-3 meta-text">Actor</th>
			<th class="p-3 meta-text">Action</th>
			<th class="p-3 meta-text">Target</th>
			<th class="p-3 meta-text">Payload</th>
		</tr></thead>
		<tbody>
			{#each data.rows as r}
				<tr class="border-b border-journal-border dark:border-journal-border-dark">
					<td class="p-3 meta-text">{new Date(r.created_at).toLocaleString()}</td>
					<td class="p-3">{r.actor?.full_name ?? r.actor_id ?? 'system'}</td>
					<td class="p-3">{r.action}</td>
					<td class="p-3">{r.target_table ?? '—'} {r.target_id ?? ''}</td>
					<td class="p-3 font-mono text-xs">{JSON.stringify(r.payload)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
