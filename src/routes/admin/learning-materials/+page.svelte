<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<div class="flex items-center justify-between">
	<h1 class="heading-1">Learning materials</h1>
	<a href="/admin/learning-materials/new" class="btn-primary">+ New</a>
</div>

<div class="card mt-6 !p-0 overflow-x-auto">
	<table class="w-full text-sm">
		<thead><tr class="border-b border-journal-border dark:border-journal-border-dark text-left">
			<th class="p-3 meta-text">Type</th>
			<th class="p-3 meta-text">Title</th>
			<th class="p-3 meta-text">Active</th>
			<th class="p-3 meta-text"></th>
		</tr></thead>
		<tbody>
			{#each data.materials as m}
				<tr class="border-b border-journal-border dark:border-journal-border-dark">
					<td class="p-3">{m.type}</td>
					<td class="p-3">{m.title}</td>
					<td class="p-3">{m.active ? 'yes' : 'no'}</td>
					<td class="p-3 flex gap-2">
						<form method="POST" action="?/toggle">
							<input type="hidden" name="id" value={m.id} />
							<input type="hidden" name="active" value={!m.active} />
							<button class="btn-secondary text-xs">{m.active ? 'Disable' : 'Enable'}</button>
						</form>
						<a class="btn-secondary text-xs" href={`/admin/learning-materials/${m.id}/edit`}>Edit</a>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
