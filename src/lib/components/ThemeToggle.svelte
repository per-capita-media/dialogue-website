<script lang="ts">
	import { theme } from '$lib/stores/theme';

	function toggle() {
		theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
	}
</script>

<button
	type="button"
	on:click={toggle}
	aria-label="Toggle dark mode"
	class="inline-flex items-center justify-center w-9 h-9 rounded-full border border-journal-border dark:border-journal-border-dark hover:bg-journal-text/5 dark:hover:bg-journal-text-dark/5 transition-colors"
>
	{#if $theme === 'dark'}
		<!-- Moon -->
		<svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
			<path
				d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
			/>
		</svg>
	{:else}
		<!-- Sun -->
		<svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
			<path
				fill-rule="evenodd"
				d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 12a4 4 0 100-8 4 4 0 000 8zm7-4a1 1 0 110 2h-1a1 1 0 110-2h1zM4 10a1 1 0 11-2 0 1 1 0 012 0zm12.95 5.536a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 011.414-1.415l.707.708zM5.172 5.172A1 1 0 113.757 3.757l.707.707A1 1 0 015.879 5.88l-.707-.707zM10 18a1 1 0 011-1v-1a1 1 0 11-2 0v1a1 1 0 011 1zm6.243-13.243a1 1 0 011.415 1.414l-.708.707A1 1 0 0115.536 5.88l.707-.708zM4.464 14.121a1 1 0 011.414 1.415l-.707.707A1 1 0 113.757 14.83l.707-.708z"
				clip-rule="evenodd"
			/>
		</svg>
	{/if}
</button>
