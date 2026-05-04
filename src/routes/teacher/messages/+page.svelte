<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<h1 class="heading-1">Messages</h1>

<section class="mt-6">
	<h2 class="heading-2">Open conversations</h2>
	{#if data.conversations.length === 0}
		<p class="body-text mt-2">No conversations yet.</p>
	{:else}
		<ul class="mt-4 space-y-2">
			{#each data.conversations as c}
				<li>
					<a href={`/teacher/messages/${c.id}`} class="card !p-4 flex justify-between items-center hover:border-accent-blue transition-colors">
						<div>
							<div class="meta-text">Programme team</div>
							<div class="font-semibold text-sm">{c.other_name ?? 'Admin'}</div>
							{#if c.last_body}
								<div class="text-xs text-journal-muted dark:text-journal-muted-dark line-clamp-1 mt-1">{c.last_body}</div>
							{/if}
						</div>
						{#if c.last_at}
							<span class="meta-text">{new Date(c.last_at).toLocaleDateString()}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="mt-10">
	<h2 class="heading-2">Start a conversation</h2>
	<div class="grid md:grid-cols-2 gap-4 mt-4">
		{#each data.admins as a}
			<form method="POST" action="?/open" class="card !p-4 flex justify-between items-center">
				<div>
					<div class="meta-text">Admin</div>
					<div class="font-semibold text-sm">{a.full_name ?? 'Admin'}</div>
				</div>
				<input type="hidden" name="target" value={a.id} />
				<button class="btn-secondary" type="submit">Open</button>
			</form>
		{/each}
	</div>
</section>
