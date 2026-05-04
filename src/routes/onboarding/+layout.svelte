<script>
	import { page } from '$app/stores';
	$: step = $page.url.pathname.endsWith('/themes') ? 2 : 1;
</script>

<section class="container max-w-xl py-12">
	<p class="meta-text mb-2">Onboarding · step {step} of 2</p>
	<div class="h-1 rounded-full bg-journal-text/10 dark:bg-journal-text-dark/10 overflow-hidden mb-8">
		<div class="h-full bg-accent-blue transition-all" style:width={`${step * 50}%`}></div>
	</div>
	<slot />
</section>
