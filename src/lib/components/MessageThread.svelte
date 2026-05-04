<script lang="ts">
	import type { Message } from '$lib/types/domain';
	export let messages: Message[];
	export let currentUserId: string;
</script>

<div class="space-y-3">
	{#each messages as m}
		<div
			class={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
				m.sender_id === currentUserId
					? 'ml-auto bg-accent-blue/10 border border-accent-blue/20'
					: 'mr-auto bg-journal-text/5 dark:bg-journal-text-dark/10'
			}`}
		>
			<div class="meta-text mb-1">{new Date(m.created_at).toLocaleString()}</div>
			{m.body}
		</div>
	{/each}
</div>
