<script lang="ts">
	import type { ActionData, PageData } from './$types';
	export let data: PageData;
	export let form: ActionData;

	function inviteUrl(role: string, token: string): string {
		return `${data.origin}/auth/signup/${role}?token=${token}`;
	}

	function statusOf(inv: { consumed_at: string | null; expires_at: string }): string {
		if (inv.consumed_at) return 'consumed';
		if (new Date(inv.expires_at).getTime() <= Date.now()) return 'expired';
		return 'pending';
	}

	function badgeFor(status: string): string {
		return status === 'pending'
			? 'badge-info'
			: status === 'consumed'
				? 'badge-success'
				: 'badge-muted';
	}

	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			/* swallow */
		}
	}
</script>

<h1 class="heading-1">Invitations</h1>
<p class="body-text mt-2">
	Issue single-use signup links for new supervisors or admins. Anyone with the link can claim
	the role exactly once before the link expires.
</p>

{#if !data.mailerReady}
	<div class="alert-error mt-4">
		<strong>Email sending is not configured.</strong> Invitations will still be created — copy
		the URL from the table and share it manually. To enable automatic sending, set
		<code>RESEND_API_KEY</code> and <code>MAIL_FROM</code> in <code>.env</code> and restart
		the dev server.
	</div>
{/if}

{#if form?.error}<div class="alert-error mt-4">{form.error}</div>{/if}
{#if form?.ok}
	<div class="alert-success mt-4">
		Invitation created.
		{#if form.emailStatus?.ok}
			Email sent ✓
		{:else if form.emailStatus?.skipped}
			(Email not sent — mailer not configured.)
		{:else if form.emailStatus?.error}
			(Email send failed: {form.emailStatus.error}.) Copy the URL below to share manually.
		{/if}
	</div>
{/if}

<form method="POST" action="?/create" class="card mt-6 grid md:grid-cols-2 gap-3">
	<div>
		<label class="label" for="role">Role</label>
		<select id="role" name="role" required class="input">
			<option value="supervisor">supervisor</option>
			<option value="admin">admin</option>
		</select>
	</div>
	<div>
		<label class="label" for="email">Recipient email</label>
		<input
			id="email"
			name="email"
			type="email"
			required
			class="input"
			placeholder="person@example.com"
		/>
	</div>
	<div>
		<label class="label" for="expires_in_days">Expires in (days)</label>
		<input
			id="expires_in_days"
			name="expires_in_days"
			type="number"
			min="1"
			max="30"
			value="7"
			class="input"
		/>
	</div>
	<div class="flex items-end">
		<label class="flex items-center gap-2 text-sm">
			<input
				type="checkbox"
				name="send_email"
				checked={data.mailerReady}
				disabled={!data.mailerReady}
			/>
			<span>Send invitation email now</span>
		</label>
	</div>
	<div class="md:col-span-2">
		<button class="btn-primary">Create invitation</button>
	</div>
</form>

<section class="mt-10">
	<h2 class="heading-2">Outstanding invitations</h2>
	{#if data.invitations.length === 0}
		<p class="body-text mt-2">None yet.</p>
	{:else}
		<div class="card mt-4 !p-0 overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-journal-border dark:border-journal-border-dark text-left">
						<th class="p-3 meta-text">Role</th>
						<th class="p-3 meta-text">For</th>
						<th class="p-3 meta-text">Status</th>
						<th class="p-3 meta-text">Expires</th>
						<th class="p-3 meta-text">Link</th>
						<th class="p-3 meta-text"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.invitations as inv}
						{@const status = statusOf(inv)}
						{@const url = inviteUrl(inv.role, inv.token)}
						<tr class="border-b border-journal-border dark:border-journal-border-dark">
							<td class="p-3"><span class={badgeFor(status)}>{inv.role}</span></td>
							<td class="p-3">{inv.email ?? '—'}</td>
							<td class="p-3">{status}</td>
							<td class="p-3 meta-text">{new Date(inv.expires_at).toLocaleString()}</td>
							<td class="p-3">
								{#if status === 'pending'}
									<div class="flex items-center gap-2">
										<input
											type="text"
											readonly
											value={url}
											class="input text-xs !py-1 !px-2 max-w-[260px] font-mono"
										/>
										<button
											type="button"
											class="btn-secondary text-xs"
											on:click={() => copy(url)}>Copy</button
										>
									</div>
								{:else}
									<span class="meta-text">—</span>
								{/if}
							</td>
							<td class="p-3 flex gap-2">
								{#if status === 'pending' && inv.email && data.mailerReady}
									<form method="POST" action="?/resendEmail">
										<input type="hidden" name="id" value={inv.id} />
										<button class="btn-secondary text-xs">Resend email</button>
									</form>
								{/if}
								{#if status === 'pending'}
									<form method="POST" action="?/revoke">
										<input type="hidden" name="id" value={inv.id} />
										<button class="btn-danger text-xs">Revoke</button>
									</form>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
