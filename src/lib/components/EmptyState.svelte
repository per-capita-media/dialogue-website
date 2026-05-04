<script lang="ts">
	export let title: string;
	export let description: string = '';
</script>

<div class="card text-center py-12">
	<h3 class="heading-2">{title}</h3>
	{#if description}<p class="body-text mt-2">{description}</p>{/if}
	<div class="mt-4"><slot /></div>
</div>
