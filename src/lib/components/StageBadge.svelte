<script lang="ts">
	import type { StudentStage } from '$lib/types/domain';
	import { STAGE_LABEL, STAGE_TONE } from '$lib/stages';

	export let stage: StudentStage;

	$: tone = STAGE_TONE[stage];
	$: cls =
		tone === 'success'
			? 'badge-success'
			: tone === 'warn'
				? 'badge-warn'
				: tone === 'info'
					? 'badge-info'
					: 'badge-muted';
</script>

<span class={cls}>{STAGE_LABEL[stage]}</span>
