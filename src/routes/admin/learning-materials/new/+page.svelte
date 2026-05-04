<script lang="ts">
	import type { ActionData } from './$types';
	export let form: ActionData;
</script>

<a href="/admin/learning-materials" class="meta-text underline">← All materials</a>
<h1 class="heading-1 mt-2">New material</h1>

<form method="POST" enctype="multipart/form-data" class="card mt-6 space-y-4">
	{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

	<div>
		<label class="label" for="material_type">Type</label>
		<select id="material_type" name="type" class="input">
			<option value="document">document</option>
			<option value="webinar">webinar</option>
		</select>
	</div>
	<div>
		<label class="label" for="material_title">Title</label>
		<input id="material_title" name="title" required class="input" />
	</div>
	<div>
		<label class="label" for="material_description">Description</label>
		<textarea id="material_description" name="description" rows="3" class="textarea"></textarea>
	</div>
	<div>
		<label class="label" for="material_file">PDF file (for documents) or video file</label>
		<input id="material_file" type="file" name="file" accept="application/pdf,video/*" class="input" />
	</div>
	<div>
		<label class="label" for="material_video_url">Or — external video URL (YouTube embed, Vimeo, etc.)</label>
		<input id="material_video_url" name="video_url" type="url" placeholder="https://www.youtube.com/embed/…" class="input" />
	</div>
	<button class="btn-primary">Create</button>
</form>
