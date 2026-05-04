<script lang="ts">
	import type { ActionData, PageData } from './$types';
	export let data: PageData;
	export let form: ActionData;
</script>

<a href="/admin/learning-materials" class="meta-text underline">← All materials</a>
<h1 class="heading-1 mt-2">Edit material</h1>

<form method="POST" enctype="multipart/form-data" class="card mt-6 space-y-4">
	{#if form?.error}<div class="alert-error">{form.error}</div>{/if}
	<input type="hidden" name="type" value={data.material.type} />
	<div>
		<label class="label">Title</label>
		<input name="title" required class="input" value={data.material.title} />
	</div>
	<div>
		<label class="label">Description</label>
		<textarea name="description" rows="3" class="textarea">{data.material.description}</textarea>
	</div>
	<div>
		<label class="label">Replace file (optional)</label>
		<input type="file" name="file" accept="application/pdf,video/*" class="input" />
		{#if data.material.storage_path}<p class="meta-text mt-1">Current path: {data.material.storage_path}</p>{/if}
	</div>
	<div>
		<label class="label">Video URL</label>
		<input name="video_url" type="url" class="input" value={data.material.video_url ?? ''} />
	</div>
	<button class="btn-primary">Save changes</button>
</form>
