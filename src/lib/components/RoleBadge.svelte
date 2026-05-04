<script lang="ts">
	import type { Role } from '$lib/types/domain';
	import { ROLE_LABEL } from '$lib/roles';

	export let role: Role;
	$: cls = role === 'admin' ? 'badge-danger' : role === 'supervisor' || role === 'editor' ? 'badge-info' : 'badge-muted';
</script>

<span class={cls}>{ROLE_LABEL[role]}</span>
