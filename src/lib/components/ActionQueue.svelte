<script lang="ts">
	/**
	 * Generic "things waiting for you" panel. Used by admin + supervisor
	 * dashboards. Each action is an object with a label, an optional count,
	 * and an href. Empty list renders a friendly "all caught up" state.
	 */
	export let title: string = 'Pending actions';
	export let actions: { label: string; count?: number; href: string; tone?: 'warn' | 'info' | 'muted' }[] = [];

	function toneClass(t?: string) {
		return t === 'warn' ? 'badge-warn' : t === 'info' ? 'badge-info' : 'badge-muted';
	}
</script>

<div class="card">
	<h2 class="heading-2">{title}</h2>
	{#if actions.length === 0}
		<p class="body-text mt-2">All caught up — nothing waiting on you.</p>
	{:else}
		<ul class="mt-3 divide-y divide-journal-border dark:divide-journal-border-dark">
			{#each actions as a}
				<li>
					<a
						href={a.href}
						class="flex items-center justify-between py-2.5 hover:text-accent-blue transition-colors"
					>
						<span class="text-sm">{a.label}</span>
						{#if typeof a.count === 'number'}
							<span class={toneClass(a.tone)}>{a.count}</span>
						{:else}
							<span class="meta-text">→</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
