<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import BauhausShapes from '$lib/components/BauhausShapes.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<div class="min-h-screen flex flex-col">
	<BauhausShapes />
	<Nav profile={data.profile} />
	<main class="flex-1">
		<slot />
	</main>
	<Footer />
</div>
