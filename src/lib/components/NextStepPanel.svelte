<script lang="ts">
	import type { Profile } from '$lib/types/domain';
	import { nextStepFor } from '$lib/stages';
	import StageBadge from './StageBadge.svelte';

	export let profile: Profile;

	$: step = nextStepFor(profile);
</script>

<div
	class="card border-accent-blue/30 bg-accent-blue/[0.04] flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
>
	<div class="flex-1">
		<p class="meta-text">Welcome back, {profile.full_name?.split(' ')[0] ?? profile.email}</p>
		<h2 class="heading-2 mt-1">Next: {step.headline}</h2>
		<p class="body-text mt-1">{step.detail}</p>
		{#if profile.role === 'student'}
			<div class="mt-3"><StageBadge stage={profile.current_stage} /></div>
		{/if}
	</div>
	<div>
		<a class="btn-primary" href={step.href}>{step.cta} →</a>
	</div>
</div>
