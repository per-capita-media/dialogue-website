<script lang="ts">
	type Tone = 'blue' | 'red' | 'yellow' | 'green' | 'slate';

	const tones: Record<Tone, string> = {
		blue: 'border-accent-blue/30 bg-accent-blue/5 text-accent-blue',
		red: 'border-accent-red/30 bg-accent-red/5 text-accent-red',
		yellow: 'border-accent-yellow/40 bg-accent-yellow/10 text-yellow-700 dark:text-yellow-300',
		green: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300',
		slate: 'border-journal-border dark:border-journal-border-dark bg-journal-text/5 dark:bg-journal-text-dark/10 text-journal-text dark:text-journal-text-dark'
	};

	const roleDashboards = [
		{
			role: 'Admin',
			tone: 'red' as Tone,
			home: 'Operations command centre',
			actions: ['Invite staff', 'Assign editors', 'Override themes', 'Monitor risk', 'Export reports'],
			data: ['All schools', 'All students', 'All pitches', 'All articles', 'All messages']
		},
		{
			role: 'Teacher',
			tone: 'yellow' as Tone,
			home: 'School cohort view',
			actions: ['Confirm student identity', 'View progress', 'Nudge deadlines', 'Message admin'],
			data: ['Own school only', 'Status summaries', 'Submitted article titles', 'Safeguarding notes']
		},
		{
			role: 'Student',
			tone: 'blue' as Tone,
			home: 'Personal newsroom desk',
			actions: ['Complete onboarding', 'Pick themes', 'Submit pitches', 'Revise drafts', 'Message editor'],
			data: ['Own profile only', 'Own quizzes', 'Own pitches', 'Own article feedback']
		},
		{
			role: 'Editor',
			tone: 'green' as Tone,
			home: 'Editorial review queue',
			actions: ['Review pitches', 'Select two', 'Give article feedback', 'Unlock article 2', 'Approve copy'],
			data: ['Assigned students only', 'Assigned pitches', 'Assigned articles', 'Private threads']
		}
	];

	const pipeline = [
		{
			stage: '0',
			name: 'Programme setup',
			owner: 'Admin',
			input: 'Term dates, schools, staff list, learning materials',
			output: 'Programme is open for applications',
			gates: ['At least one editor', 'Document + webinar live', 'Quizzes active']
		},
		{
			stage: '1',
			name: 'Application & school check',
			owner: 'Student + Teacher',
			input: 'Student account, teacher contact, school details',
			output: 'Verified student profile',
			gates: ['Teacher email confirmed', 'No duplicate student record', 'Consent captured']
		},
		{
			stage: '2',
			name: 'Onboarding',
			owner: 'Student',
			input: 'Profile fields and two themes',
			output: 'Locked student setup',
			gates: ['Exactly two themes', 'Themes from approved list', 'Admin-only override']
		},
		{
			stage: '3',
			name: 'Learning',
			owner: 'Student',
			input: 'Primer document, webinar, two quizzes',
			output: 'Pitch section unlocked',
			gates: ['Document quiz passed', 'Webinar quiz passed', 'Attempts logged']
		},
		{
			stage: '4',
			name: 'Pitching',
			owner: 'Student',
			input: 'Five story ideas across chosen themes',
			output: 'Editorial selection queue',
			gates: ['5 complete pitches', 'Theme validation', 'No cross-student visibility']
		},
		{
			stage: '5',
			name: 'Editorial selection',
			owner: 'Editor',
			input: 'Five submitted pitches',
			output: 'Article 1 and Article 2 created',
			gates: ['Exactly two selected', 'Article 1 unlocked', 'Article 2 locked']
		},
		{
			stage: '6',
			name: 'Article 1 cycle',
			owner: 'Student + Editor',
			input: 'Selected pitch 1',
			output: 'Approved article 1',
			gates: ['Draft submitted', 'Feedback visible', 'Revision or approval decision']
		},
		{
			stage: '7',
			name: 'Article 2 cycle',
			owner: 'Student + Editor',
			input: 'Selected pitch 2',
			output: 'Approved article 2',
			gates: ['Editor/admin unlock', 'Draft submitted', 'Final feedback recorded']
		},
		{
			stage: '8',
			name: 'Completion & reporting',
			owner: 'Admin + Teacher',
			input: 'Two approved articles and audit trail',
			output: 'Programme complete record',
			gates: ['Completion certificate', 'School summary', 'Archive retained']
		}
	];

	const inboxRules = [
		['Student ↔ Editor', 'Private article and pitch support for assigned pairs only.'],
		['Student ↔ Admin', 'Operational and safeguarding support.'],
		['Teacher ↔ Admin', 'School verification, attendance, deadline nudges.'],
		['Editor ↔ Admin', 'Escalations, assignment changes, publication readiness.'],
		['Blocked', 'Student ↔ student, teacher ↔ unrelated student, editor ↔ unassigned student.']
	];

	const screens = [
		{
			name: 'Admin operations',
			items: ['Cohort health', 'School verification queue', 'Staff assignment matrix', 'Risk and audit feed']
		},
		{
			name: 'Teacher portal',
			items: ['Own-school roster', 'Progress by stage', 'Missing setup fields', 'Download school report']
		},
		{
			name: 'Student workspace',
			items: ['Next required action', 'Learning gates', 'Pitch slots', 'Article drafting room']
		},
		{
			name: 'Editor desk',
			items: ['Assigned students', 'Pitch selection queue', 'Article review queue', 'Feedback templates']
		}
	];
</script>

<section class="container py-8 md:py-10">
	<div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<p class="meta-text mb-3">Full-scale operating mockup</p>
			<h1 class="heading-1 text-3xl md:text-4xl max-w-4xl">Dialogue newsroom pipeline</h1>
			<p class="body-text mt-4 max-w-3xl">
				End-to-end flow for admins, teachers, students, and editors, from school setup to
				final article approval.
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<a href="#roles" class="btn-secondary">Roles</a>
			<a href="#pipeline" class="btn-secondary">Pipeline</a>
			<a href="#screens" class="btn-secondary">Screens</a>
		</div>
	</div>
</section>

<section id="roles" class="border-y border-journal-border dark:border-journal-border-dark">
	<div class="container py-8">
		<div class="grid gap-4 lg:grid-cols-4">
			{#each roleDashboards as role}
				<article class={`rounded-lg border p-5 ${tones[role.tone]}`}>
					<p class="meta-text">{role.role}</p>
					<h2 class="heading-3 mt-2">{role.home}</h2>
					<div class="mt-4">
						<p class="text-xs font-semibold uppercase tracking-[0.12em]">Primary actions</p>
						<ul class="mt-2 space-y-1 text-sm">
							{#each role.actions as action}
								<li>{action}</li>
							{/each}
						</ul>
					</div>
					<div class="mt-4 pt-4 border-t border-current/20">
						<p class="text-xs font-semibold uppercase tracking-[0.12em]">Can see</p>
						<ul class="mt-2 space-y-1 text-sm">
							{#each role.data as item}
								<li>{item}</li>
							{/each}
						</ul>
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>

<section id="pipeline" class="container py-10">
	<div class="flex items-center justify-between gap-4">
		<div>
			<p class="meta-text">Operational pipeline</p>
			<h2 class="heading-2 mt-2">Stage gates and handoffs</h2>
		</div>
		<span class="badge-info">Secure by default</span>
	</div>

	<div class="mt-6 overflow-x-auto rounded-lg border border-journal-border dark:border-journal-border-dark">
		<table class="w-full min-w-[960px] text-sm">
			<thead class="bg-journal-text/[0.03] dark:bg-journal-text-dark/[0.04] text-left">
				<tr>
					<th class="p-4 meta-text">Stage</th>
					<th class="p-4 meta-text">Workflow</th>
					<th class="p-4 meta-text">Owner</th>
					<th class="p-4 meta-text">Input</th>
					<th class="p-4 meta-text">Output</th>
					<th class="p-4 meta-text">Gate</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-journal-border dark:divide-journal-border-dark">
				{#each pipeline as row}
					<tr class="align-top">
						<td class="p-4">
							<span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-journal-text text-journal-bg dark:bg-journal-text-dark dark:text-journal-bg-dark font-bold">
								{row.stage}
							</span>
						</td>
						<td class="p-4 font-semibold">{row.name}</td>
						<td class="p-4">{row.owner}</td>
						<td class="p-4 text-journal-muted dark:text-journal-muted-dark">{row.input}</td>
						<td class="p-4 text-journal-muted dark:text-journal-muted-dark">{row.output}</td>
						<td class="p-4">
							<div class="flex flex-wrap gap-1">
								{#each row.gates as gate}
									<span class="badge-muted">{gate}</span>
								{/each}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<section id="screens" class="border-y border-journal-border dark:border-journal-border-dark bg-journal-text/[0.02] dark:bg-journal-text-dark/[0.03]">
	<div class="container py-10">
		<div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
			<div>
				<p class="meta-text">Mock dashboard map</p>
				<h2 class="heading-2 mt-2">What each user opens first</h2>
				<div class="mt-6 grid gap-4 md:grid-cols-2">
					{#each screens as screen}
						<article class="card">
							<h3 class="heading-3">{screen.name}</h3>
							<ul class="mt-4 space-y-2 text-sm text-journal-muted dark:text-journal-muted-dark">
								{#each screen.items as item}
									<li class="flex items-center gap-2">
										<span class="h-2 w-2 rounded-full bg-accent-blue"></span>
										{item}
									</li>
								{/each}
							</ul>
						</article>
					{/each}
				</div>
			</div>

			<div class="card">
				<p class="meta-text">Messaging rules</p>
				<h2 class="heading-2 mt-2">Conversation matrix</h2>
				<div class="mt-5 divide-y divide-journal-border dark:divide-journal-border-dark">
					{#each inboxRules as rule}
						<div class="py-4">
							<div class="flex items-start justify-between gap-4">
								<h3 class="heading-3">{rule[0]}</h3>
								<span class={rule[0] === 'Blocked' ? 'badge-danger' : 'badge-success'}>
									{rule[0] === 'Blocked' ? 'Denied' : 'Allowed'}
								</span>
							</div>
							<p class="body-text mt-2 text-sm">{rule[1]}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

<section class="container py-10">
	<div class="grid gap-6 lg:grid-cols-3">
		<div class="lg:col-span-2">
			<p class="meta-text">Recommended build path</p>
			<h2 class="heading-2 mt-2">Turn mockup into production roles</h2>
			<div class="mt-5 rounded-lg border border-journal-border dark:border-journal-border-dark overflow-hidden">
				<div class="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-journal-border dark:divide-journal-border-dark">
					<div class="p-5">
						<span class="badge-info">Phase 1</span>
						<h3 class="heading-3 mt-3">Rename supervisor to editor</h3>
						<p class="body-text mt-2 text-sm">Keep current RLS shape and copy; editor remains assigned-students only.</p>
					</div>
					<div class="p-5">
						<span class="badge-warn">Phase 2</span>
						<h3 class="heading-3 mt-3">Add teacher portal</h3>
						<p class="body-text mt-2 text-sm">School-scoped read-only dashboards, verification, admin messaging.</p>
					</div>
					<div class="p-5">
						<span class="badge-success">Phase 3</span>
						<h3 class="heading-3 mt-3">Publication workflow</h3>
						<p class="body-text mt-2 text-sm">Final copy approval, certificates, exports, and archive controls.</p>
					</div>
				</div>
			</div>
		</div>

		<aside class="card">
			<p class="meta-text">Security note</p>
			<h2 class="heading-3 mt-2">Schema changes required</h2>
			<p class="body-text mt-3 text-sm">
				Teachers and editors should be first-class roles only after the RLS policies,
				invitation flows, assignments, and message constraints are extended together.
			</p>
			<a href="/admin" class="btn-primary mt-5 w-full">Back to live admin</a>
		</aside>
	</div>
</section>
