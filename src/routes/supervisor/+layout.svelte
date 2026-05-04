<script lang="ts">
	import { page } from '$app/stores';
	const links = [
		{ href: '/supervisor', label: 'Dashboard' },
		{ href: '/supervisor/messages', label: 'Messages' }
	];
	$: active = (h: string) => (h === '/supervisor' ? $page.url.pathname === h : $page.url.pathname.startsWith(h));
</script>

<div class="container py-8 grid md:grid-cols-[200px_1fr] gap-8">
	<aside class="md:sticky md:top-20 self-start">
		<div class="card !p-4">
			<p class="meta-text">Supervisor</p>
		</div>
		<nav class="mt-4 flex flex-col gap-1">
			{#each links as l}
				<a
					href={l.href}
					class={`px-3 py-2 rounded-md text-sm transition-colors ${
						active(l.href)
							? 'bg-accent-blue/10 text-accent-blue'
							: 'hover:bg-journal-text/5 dark:hover:bg-journal-text-dark/5'
					}`}>{l.label}</a
				>
			{/each}
		</nav>
	</aside>
	<section><slot /></section>
</div>
