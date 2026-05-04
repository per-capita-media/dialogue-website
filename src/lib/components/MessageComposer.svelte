<script lang="ts">
	import { enhance } from '$app/forms';
	export let action = '?/send';
	let body = '';
	let sending = false;
</script>

<form
	method="POST"
	{action}
	use:enhance={() => {
		sending = true;
		return async ({ update }) => {
			await update();
			sending = false;
			body = '';
		};
	}}
	class="flex gap-2 items-end"
>
	<textarea
		name="body"
		bind:value={body}
		rows="2"
		placeholder="Type a message…"
		class="textarea flex-1"
		required
	></textarea>
	<button type="submit" class="btn-primary" disabled={!body.trim() || sending}>
		{sending ? 'Sending…' : 'Send'}
	</button>
</form>
