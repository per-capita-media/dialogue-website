<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<h1 class="heading-1">All conversations</h1>
<p class="body-text mt-2">Admins can read every thread. Open one to see the messages.</p>

<div class="card mt-6 !p-0 overflow-x-auto">
	<table class="w-full text-sm">
		<thead><tr class="border-b border-journal-border dark:border-journal-border-dark text-left">
			<th class="p-3 meta-text">Kind</th>
			<th class="p-3 meta-text">Participant A</th>
			<th class="p-3 meta-text">Participant B</th>
			<th class="p-3 meta-text">Created</th>
		</tr></thead>
		<tbody>
			{#each data.convos as c}
				<tr class="border-b border-journal-border dark:border-journal-border-dark">
					<td class="p-3">{c.kind.replace('_', ' ')}</td>
					<td class="p-3">{c.a?.full_name ?? c.participant_a} <span class="meta-text">({c.a?.role})</span></td>
					<td class="p-3">{c.b?.full_name ?? c.participant_b} <span class="meta-text">({c.b?.role})</span></td>
					<td class="p-3">{new Date(c.created_at).toLocaleString()}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
