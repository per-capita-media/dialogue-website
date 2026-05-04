<script lang="ts">
	import type { ActionData, PageData } from './$types';
	export let data: PageData;
	export let form: ActionData;
</script>

<h1 class="heading-1">Assignments & roles</h1>
{#if form?.error}<div class="alert-error mt-4">{form.error}</div>{/if}
{#if form?.ok}<div class="alert-success mt-4">Saved.</div>{/if}

<section class="mt-6">
	<h2 class="heading-2">Promote a user</h2>
	<form method="POST" action="?/promote" class="card mt-3 grid md:grid-cols-3 gap-3 items-end">
		<div>
			<label class="label">User</label>
			<select name="profile_id" required class="input">
				<option value="" disabled selected>Pick…</option>
				{#each [...data.students, ...data.supervisors] as p}
					<option value={p.id}>{p.full_name ?? p.email}</option>
				{/each}
			</select>
		</div>
		<div>
			<label class="label">New role</label>
			<select name="new_role" required class="input">
				<option value="student">student</option>
				<option value="supervisor">supervisor</option>
				<option value="admin">admin</option>
			</select>
		</div>
		<button class="btn-primary">Apply</button>
	</form>
</section>

<section class="mt-10">
	<h2 class="heading-2">Add an assignment</h2>
	<form method="POST" action="?/create" class="card mt-3 grid md:grid-cols-3 gap-3 items-end">
		<div>
			<label class="label">Student</label>
			<select name="student_id" required class="input">
				<option value="" disabled selected>Pick…</option>
				{#each data.students as s}<option value={s.id}>{s.full_name ?? s.email}</option>{/each}
			</select>
		</div>
		<div>
			<label class="label">Supervisor</label>
			<select name="supervisor_id" required class="input">
				<option value="" disabled selected>Pick…</option>
				{#each data.supervisors as s}<option value={s.id}>{s.full_name ?? s.email}</option>{/each}
			</select>
		</div>
		<button class="btn-primary">Assign</button>
	</form>
</section>

<section class="mt-10">
	<h2 class="heading-2">Current assignments</h2>
	<div class="card mt-3 !p-0 overflow-x-auto">
		<table class="w-full text-sm">
			<thead><tr class="border-b border-journal-border dark:border-journal-border-dark text-left">
				<th class="p-3 meta-text">Student</th>
				<th class="p-3 meta-text">Supervisor</th>
				<th class="p-3 meta-text">Since</th>
				<th class="p-3 meta-text"></th>
			</tr></thead>
			<tbody>
				{#each data.assignments as a}
					{@const s = data.students.find((x) => x.id === a.student_id)}
					{@const sup = data.supervisors.find((x) => x.id === a.supervisor_id)}
					<tr class="border-b border-journal-border dark:border-journal-border-dark">
						<td class="p-3">{s?.full_name ?? a.student_id}</td>
						<td class="p-3">{sup?.full_name ?? a.supervisor_id}</td>
						<td class="p-3">{new Date(a.assigned_at).toLocaleDateString()}</td>
						<td class="p-3">
							<form method="POST" action="?/remove">
								<input type="hidden" name="id" value={a.id} />
								<button class="btn-danger">Remove</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
