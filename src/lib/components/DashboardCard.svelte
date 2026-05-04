<script lang="ts">
	export let title: string;
	export let description: string = '';
	export let href: string | null = null;
	export let status: 'locked' | 'pending' | 'in-progress' | 'done' | null = null;
	export let actionLabel: string = 'Open';

	$: badgeCls =
		status === 'done'
			? 'badge-success'
			: status === 'in-progress'
				? 'badge-info'
				: status === 'pending'
					? 'badge-warn'
					: status === 'locked'
						? 'badge-muted'
						: '';
</script>

<div class="card flex flex-col gap-3">
	<div class="flex items-start justify-between gap-3">
		<h3 class="heading-2">{title}</h3>
		{#if status}
			<span class={badgeCls}>{status}</span>
		{/if}
	</div>
	{#if description}
		<p class="body-text">{description}</p>
	{/if}
	<slot />
	{#if href}
		<div>
			<a class={status === 'locked' ? 'btn-secondary opacity-50 pointer-events-none' : 'btn-primary'} href={href}>
				{actionLabel}
			</a>
		</div>
	{/if}
</div>
