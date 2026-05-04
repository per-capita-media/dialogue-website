<script lang="ts">
	import MessageThread from '$lib/components/MessageThread.svelte';
	import MessageComposer from '$lib/components/MessageComposer.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<a href="/student/messages" class="meta-text underline">← All conversations</a>
<h1 class="heading-1 mt-2">Conversation</h1>

<div class="mt-6">
	<MessageThread messages={data.messages} currentUserId={data.userId} />
</div>
<div class="mt-6">
	<MessageComposer />
</div>
