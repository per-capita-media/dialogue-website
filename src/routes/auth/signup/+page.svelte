<script lang="ts">
	import type { ActionData } from './$types';
	export let form: ActionData;
</script>

<section class="container max-w-2xl py-12 md:py-16">
	<!-- ── Student signup (the dominant path) ───────────────────────── -->
	<div class="card border-accent-blue/30 bg-accent-blue/[0.04]">
		<p class="meta-text">Apply as a</p>
		<h1 class="heading-1 mt-1">Student</h1>
		<p class="body-text mt-2">
			Anyone can apply. You'll set up your profile, pick two themes, take two short quizzes,
			submit five pitches and write two articles with feedback from an editor.
		</p>

		{#if form?.sent}
			<div class="alert-success mt-6">
				We've sent a confirmation link to <strong>{form.email}</strong>. Click it to finish
				creating your account.
			</div>
		{:else}
			<form method="POST" class="mt-6 space-y-4">
				{#if form?.error}<div class="alert-error">{form.error}</div>{/if}
				<div>
					<label class="label" for="email">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						class="input"
						value={form?.email ?? ''}
					/>
				</div>
				<div>
					<label class="label" for="password">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						minlength="8"
						class="input"
					/>
				</div>
				<button type="submit" class="btn-primary w-full">Create student account</button>
				<p class="meta-text text-center">
					Already registered? <a href="/auth/login" class="underline">Sign in</a>
				</p>
			</form>
		{/if}
	</div>

	<!-- ── Invitation-only paths (small, secondary) ─────────────────── -->
	<div class="mt-10">
		<p class="meta-text">Have an invitation?</p>
		<div class="grid sm:grid-cols-2 gap-3 mt-3">
			<a
				href="/auth/signup/editor"
				class="card !p-4 hover:border-accent-blue transition-colors"
			>
				<p class="meta-text">By invitation</p>
				<h3 class="heading-3 mt-1">I'm an editor</h3>
				<p class="body-text text-xs mt-1">Use the link an admin sent you.</p>
			</a>
			<a href="/auth/signup/teacher" class="card !p-4 hover:border-accent-blue transition-colors">
				<p class="meta-text">By invitation</p>
				<h3 class="heading-3 mt-1">I'm a teacher</h3>
				<p class="body-text text-xs mt-1">Use the link an admin sent you.</p>
			</a>
			<a href="/auth/signup/admin" class="card !p-4 hover:border-accent-blue transition-colors">
				<p class="meta-text">By invitation</p>
				<h3 class="heading-3 mt-1">I'm a new admin</h3>
				<p class="body-text text-xs mt-1">Use the link an existing admin sent you.</p>
			</a>
		</div>
	</div>
</section>
