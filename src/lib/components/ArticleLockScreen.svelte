<script lang="ts">
	export let title: string = 'Article 2 is locked';
	export let body: string =
		'Article 2 will unlock once your supervisor (or an admin) opens it. You will be notified.';
</script>

<div class="card text-center py-16">
	<div
		class="mx-auto w-12 h-12 rounded-full bg-journal-text/5 dark:bg-journal-text-dark/10 flex items-center justify-center mb-4"
	>
		<svg viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6 opacity-60">
			<path
				fill-rule="evenodd"
				d="M5 9V7a5 5 0 0110 0v2h.5A1.5 1.5 0 0117 10.5v6A1.5 1.5 0 0115.5 18h-11A1.5 1.5 0 013 16.5v-6A1.5 1.5 0 014.5 9H5zm2 0V7a3 3 0 116 0v2H7z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>
	<h2 class="heading-2">{title}</h2>
	<p class="body-text mt-2 max-w-md mx-auto">{body}</p>
</div>
