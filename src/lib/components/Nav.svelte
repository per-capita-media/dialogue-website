<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';
	import type { Profile } from '$lib/types/domain';
	import { dashboardForRole } from '$lib/roles';

	export let profile: Profile | null = null;

	// `dashboardForRole` is server-safe but pure — fine to call here.
	$: dashHref = profile ? dashboardForRole(profile.role) : null;
</script>

<header
	class="sticky top-0 z-30 bg-journal-bg/95 dark:bg-journal-bg-dark/95 border-b-2 border-journal-text dark:border-journal-text-dark"
>
	<div class="container flex items-center justify-between py-3">
		<a href="/" class="group flex items-center gap-3">
			<img
				src="/per-capita-logo.jpg"
				alt="Per Capita Media"
				class="h-11 w-11 rounded-sm object-cover"
			/>
			<span>
				<span class="block font-display text-2xl font-bold leading-none group-hover:text-accent-red transition-colors">
					Dialogue
				</span>
				<span class="meta-text block text-[0.58rem]">Per Capita Media</span>
			</span>
		</a>

		<nav class="flex items-center gap-2 md:gap-4">
			{#if dashHref}
				<a href={dashHref} class="text-sm font-semibold hover:text-accent-red transition-colors"
					>Dashboard</a
				>
				<form method="POST" action="/auth/logout">
					<button type="submit" class="text-sm font-semibold hover:text-accent-red transition-colors"
						>Sign out</button
					>
				</form>
			{:else}
				<a href="/auth/login" class="text-sm font-semibold hover:text-accent-red transition-colors"
					>Sign in</a
				>
				<a href="/auth/signup" class="btn-primary text-xs px-3 py-1.5">Apply</a>
			{/if}
			<ThemeToggle />
		</nav>
	</div>
</header>
