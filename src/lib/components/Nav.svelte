<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';
	import type { Profile } from '$lib/types/domain';
	import { dashboardForRole } from '$lib/roles';

	export let profile: Profile | null = null;

	// `dashboardForRole` is server-safe but pure — fine to call here.
	$: dashHref = profile ? dashboardForRole(profile.role) : null;
</script>

<header
	class="sticky top-0 z-30 backdrop-blur bg-journal-bg/80 dark:bg-journal-bg-dark/80 border-b border-journal-border dark:border-journal-border-dark"
>
	<div class="container flex items-center justify-between py-4">
		<a href="/" class="flex items-center gap-3 group">
			<span
				class="inline-flex w-8 h-8 rounded bg-accent-blue items-center justify-center text-white font-display text-base"
				>D</span
			>
			<span class="heading-1 group-hover:text-accent-blue transition-colors text-base md:text-lg">
				Dialogue
			</span>
		</a>

		<nav class="flex items-center gap-2 md:gap-4">
			{#if dashHref}
				<a href={dashHref} class="text-sm font-medium hover:text-accent-blue transition-colors"
					>Dashboard</a
				>
				<form method="POST" action="/auth/logout">
					<button type="submit" class="text-sm font-medium hover:text-accent-red transition-colors"
						>Sign out</button
					>
				</form>
			{:else}
				<a href="/auth/login" class="text-sm font-medium hover:text-accent-blue transition-colors"
					>Sign in</a
				>
				<a href="/auth/signup" class="btn-primary text-xs px-3 py-1.5">Apply</a>
			{/if}
			<ThemeToggle />
		</nav>
	</div>
</header>
