<script lang="ts">
	import type { ActionData } from './$types';
	export let form: ActionData;
</script>

<section class="container max-w-md py-16">
	<h1 class="heading-1">Sign in</h1>
	<form method="POST" class="mt-8 space-y-4">
		{#if form?.error}
			<div class="alert-error">{form.error}</div>
		{/if}
		<div>
			<label class="label" for="email">Email</label>
			<input id="email" name="email" type="email" required class="input" value={form?.email ?? ''} />
		</div>
		<div>
			<label class="label" for="password">Password</label>
			<input id="password" name="password" type="password" required class="input" />
		</div>
		<button type="submit" class="btn-primary w-full">Sign in</button>
		<p class="meta-text text-center">
			New here? <a href="/auth/signup" class="underline">Apply for a place</a>
		</p>
	</form>
</section>
