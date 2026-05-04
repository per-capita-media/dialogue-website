<script lang="ts">
	import type { ActionData, PageData } from './$types';
	export let data: PageData;
	export let form: ActionData;

	const REASONS: Record<string, string> = {
		'no-token': 'This page is for new admins invited by an existing admin. Ask another admin for a signup link.',
		'unknown-token': 'That invitation link is not recognised.',
		'wrong-role': 'That invitation is not an admin invitation.',
		consumed: 'That invitation has already been used.',
		expired: 'That invitation has expired.'
	};
</script>

<section class="container max-w-md py-16">
	<a href="/auth/signup" class="meta-text underline">← All signup options</a>
	<h1 class="heading-1 mt-2">Admin signup</h1>

	{#if !data.usable}
		<div class="alert-error mt-6">
			{REASONS[data.reason] ?? 'Invitation not valid.'}
		</div>
		<p class="body-text mt-4 text-sm">
			Admin accounts are issued by invitation only. The very first admin is created via the
			<code>create-admin</code> CLI script. Every subsequent admin must be invited by an
			existing admin.
		</p>
	{:else}
		<p class="body-text mt-2">Welcome — finish setting up your admin account.</p>

		<form method="POST" class="mt-8 space-y-4">
			{#if form?.error}<div class="alert-error">{form.error}</div>{/if}
			<div>
				<label class="label" for="full_name">Full name</label>
				<input id="full_name" name="full_name" required class="input" value={form?.values?.full_name ?? ''} />
			</div>
			<div>
				<label class="label" for="email">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					class="input"
					value={form?.values?.email ?? data.invitationEmailHint ?? ''}
				/>
			</div>
			<div>
				<label class="label" for="password">Password</label>
				<input id="password" name="password" type="password" required minlength="8" class="input" />
			</div>
			<button type="submit" class="btn-primary w-full">Create admin account</button>
		</form>
	{/if}
</section>
