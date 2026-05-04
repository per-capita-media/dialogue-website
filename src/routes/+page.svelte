<script lang="ts">
	import type { PageData } from './$types';
	import NextStepPanel from '$lib/components/NextStepPanel.svelte';
	export let data: PageData;

	const samplePieces = [
		{
			section: 'Politics',
			title: 'Your council cuts the youth budget. Who pays?',
			dek: 'Read the documents. Call the people affected. Turn a dry local meeting into a story about power, money, and priorities.',
			byline: 'Year 12 brief',
			status: 'Pitch in development',
			tone: 'border-accent-red/50 bg-accent-red/[0.07]',
			strip: 'bg-accent-red'
		},
		{
			section: 'Economics',
			title: 'Why does growing up now feel so expensive?',
			dek: 'Use housing, wages, tuition, and debt to write about the economy as something lived, not just graphed.',
			byline: 'Economics desk',
			status: 'Edited draft',
			tone: 'border-accent-yellow/60 bg-accent-yellow/[0.12]',
			strip: 'bg-accent-yellow'
		},
		{
			section: 'Culture',
			title: 'Stop arguing about culture. Go and report it.',
			dek: 'Find the theatre group, the mosque fundraiser, the football stand, the TikTok argument, then ask what it reveals.',
			byline: 'Commentary strand',
			status: 'Argument workshop',
			tone: 'border-accent-blue/45 bg-accent-blue/[0.07]',
			strip: 'bg-accent-blue'
		},
		{
			section: 'Open access',
			title: 'What happens when journalism is locked away?',
			dek: 'Make the case for public-interest writing that students, parents, teachers, and local readers can actually access.',
			byline: 'Media essay',
			status: 'Research note',
			tone: 'border-emerald-700/35 bg-emerald-700/[0.07]',
			strip: 'bg-emerald-700'
		},
		{
			section: 'Reporting',
			title: 'The best story may be five minutes away',
			dek: 'Walk the high street. Notice the empty shop, the campaign poster, the bus route, the queue. Then ask why.',
			byline: 'Local desk',
			status: 'Field brief',
			tone: 'border-fuchsia-900/35 bg-fuchsia-900/[0.06]',
			strip: 'bg-fuchsia-900'
		}
	];

	const outcomes = [
		{
			text: 'Leave with edited work, not just a certificate',
			colour: 'bg-accent-red'
		},
		{
			text: 'Turn curiosity into concrete evidence for applications',
			colour: 'bg-accent-yellow'
		},
		{
			text: 'Learn how to pitch an idea before you write it',
			colour: 'bg-accent-blue'
		},
		{
			text: 'Get used to criticism while the stakes are real but supportive',
			colour: 'bg-emerald-700'
		}
	];

	const standards = [
		'What did you notice that other people missed?',
		'Who did you speak to, read, or observe?',
		'What is your argument in one clean sentence?',
		'Why should a reader outside your school care?',
		'Can you take an edit and make the piece sharper?'
	];

	const beats = [
		{
			name: 'Politics',
			audience: 'For the student who cannot stop asking who decided this.',
			line: 'Turn power into a story you can prove.',
			body: 'Follow councils, campaigns, public services, schools, elections, and institutions. Learn to move from outrage to reporting.',
			proof: 'You might leave with a piece on a local cut, a school policy, or a campaign nobody outside your area has noticed.',
			colour: 'border-accent-red bg-accent-red/[0.07]'
		},
		{
			name: 'Economics',
			audience: 'For the economics applicant who wants more than textbook examples.',
			line: 'Make trade-offs human without making them simple.',
			body: 'Write about housing, wages, debt, productivity, inequality, incentives, public spending, markets, and the cost of growing up.',
			proof: 'You might build an application-strength article that shows you can connect evidence, theory, and real life.',
			colour: 'border-accent-yellow bg-accent-yellow/[0.14]'
		},
		{
			name: 'Culture',
			audience: 'For the theatre kid, artist, reviewer, musician, or film obsessive.',
			line: 'Turn taste into criticism.',
			body: 'Take theatre, film, books, music, art, sport, faith, internet culture, criticism, and performance seriously.',
			proof: 'You might write the review that explains why a production worked, why an audience reacted, or what a cultural argument is missing.',
			colour: 'border-accent-blue bg-accent-blue/[0.08]'
		},
		{
			name: 'Place',
			audience: 'For the observer who knows their area is not boring.',
			line: 'Use where you live as evidence.',
			body: 'Report high streets, youth services, venues, charities, transport, local campaigns, community groups, and stories hiding in plain sight.',
			proof: 'You might show how a national question looks on one street, in one venue, or through one community.',
			colour: 'border-emerald-700 bg-emerald-700/[0.08]'
		}
	];
</script>

<section class="border-b border-journal-border bg-accent-yellow/[0.08] dark:border-journal-border-dark dark:bg-accent-yellow/[0.04]">
	<div class="container py-10 md:py-16">
	{#if data.profile}
		<NextStepPanel profile={data.profile} />
	{:else}
		<div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
			<div>
				<p class="meta-text mb-4">Per Capita Media presents</p>
				<div class="mb-5 flex flex-wrap gap-2">
					<span class="badge border border-accent-red/30 bg-accent-red/10 text-accent-red dark:text-red-300">Applications open</span>
					<span class="badge border border-accent-yellow/40 bg-accent-yellow/20 text-yellow-800 dark:text-yellow-200">Selective cohort</span>
					<span class="badge border border-accent-blue/30 bg-accent-blue/10 text-accent-blue dark:text-blue-200">Open-access ethos</span>
				</div>
				<h1 class="heading-display max-w-4xl">
					Turn what you notice into writing that matters.
				</h1>
				<div class="divider-thick mt-6 max-w-4xl"></div>
				<p class="body-text mt-6 max-w-3xl text-lg md:text-xl">
					For sixth-form students who read the news and think: I could say something sharper
					than that.
				</p>
				<p class="body-text mt-4 max-w-3xl">
					Dialogue is Per Capita Media’s editorial fellowship for ambitious young writers. You
					bring a question about politics, economics, culture, art, performance, or the place
					you live. We help you turn it into a pitch, report it properly, write it clearly,
					and revise it like it is meant to be read. The result is not another
					extracurricular line. It is proof that you can think in public.
				</p>
				<div class="mt-10 flex gap-3 flex-wrap">
					<a class="btn-primary" href="/auth/signup">Apply as a student</a>
					<a class="btn-secondary" href="/parents-teachers">For parents and teachers</a>
					<a class="btn-secondary" href="/auth/login">Sign in</a>
				</div>
			</div>

			<div class="relative">
				<div class="absolute -inset-4 border border-accent-red/40 bg-journal-bg dark:bg-journal-bg-dark"></div>
				<div class="relative bg-black p-6 shadow-2xl shadow-journal-text/10">
					<img
						src="/per-capita-logo.jpg"
						alt="Per Capita Media"
						class="aspect-square w-full object-cover"
					/>
					<div class="mt-6 border-t border-white/30 pt-5 text-white">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
							Per Capita Media training scheme
						</p>
						<p class="mt-2 font-display text-3xl font-bold leading-tight">
							Notice more. Argue better. Write for readers.
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
	</div>
</section>

<section class="border-y border-journal-border bg-accent-blue/[0.06] dark:border-journal-border-dark dark:bg-accent-blue/[0.08]">
	<div class="container grid gap-8 py-10 md:grid-cols-3">
		<div>
			<p class="meta-text">The standard</p>
			<h2 class="heading-2 mt-2">Most people have takes. Few can report, argue, and revise.</h2>
		</div>
		<p class="body-text md:col-span-2 md:text-lg">
			That is the gap Dialogue closes. You learn to move from “I care about this” to “I can
			show you why this matters.” You find an angle, test it against evidence, write for a real
			reader, and come back to the draft when an editor pushes you harder.
		</p>
	</div>
</section>

<section class="container py-14">
	<div class="grid gap-8 border-l-8 border-accent-red pl-6 md:grid-cols-[0.8fr_1.2fr] md:items-start md:pl-8">
		<div>
			<p class="meta-text">Why Dialogue</p>
			<h2 class="heading-2 mt-3">Not content creation. Not school newspaper filler. Public argument.</h2>
		</div>
		<div class="space-y-4">
			<p class="body-text text-lg">
				The best young writers are already watching the world closely. They see the empty shop
				on the corner, the policy that misses their town, the play everyone applauded but no
				one understood, the cultural argument everyone is repeating without evidence. Dialogue
				gives that attention somewhere serious to go.
			</p>
			<p class="body-text">
				You do not need to arrive polished. You need appetite, curiosity, and the nerve to have
				your first draft improved. We care about grassroots reporting because the public
				conversation is weaker when only metropolitan, paywalled, already-approved voices get
				heard.
			</p>
		</div>
	</div>
</section>

<section class="border-y border-journal-border bg-journal-surface dark:border-journal-border-dark dark:bg-journal-surface-dark">
	<div class="container py-14">
		<div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="meta-text">Choose your beat</p>
				<h2 class="heading-2 mt-3 max-w-2xl">
					Find the subject you already care about. Then make it sharper than interest.
				</h2>
			</div>
			<p class="body-text max-w-xl">
				You do not need to fit one mould. A theatre review, a housing graph, a council vote,
				or a high street can all become serious journalism when the question is good enough.
			</p>
		</div>

		<div class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{#each beats as beat}
				<article class={`border-t-4 p-5 ${beat.colour}`}>
					<p class="meta-text">{beat.name}</p>
					<p class="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-journal-muted dark:text-journal-muted-dark">
						{beat.audience}
					</p>
					<h3 class="mt-3 font-display text-2xl font-bold leading-tight">{beat.line}</h3>
					<p class="body-text mt-4 text-sm">{beat.body}</p>
					<p class="mt-5 border-t border-current/20 pt-4 text-sm font-semibold leading-relaxed">
						{beat.proof}
					</p>
				</article>
			{/each}
		</div>
	</div>
</section>

<section class="container py-14">
	<div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
		<div>
			<p class="meta-text">Start here</p>
			<h2 class="heading-2 mt-3 max-w-2xl">
				Do not wait for permission to find a story.
			</h2>
		</div>
		<p class="body-text max-w-xl">
			These are the kinds of briefs students learn to shape: local enough to report, ambitious
			enough to matter, and sharp enough to survive editing.
		</p>
	</div>

	<div class="mt-8 overflow-x-auto pb-4">
		<div class="flex snap-x gap-4">
			{#each samplePieces as piece}
				<article class={`card group min-w-[290px] snap-start transition duration-300 hover:-translate-y-1 hover:border-journal-text hover:shadow-xl hover:shadow-journal-text/10 md:min-w-[380px] ${piece.tone}`}>
					<div class={`absolute inset-x-0 top-0 h-1.5 ${piece.strip}`}></div>
					<div class="flex items-center justify-between gap-4">
						<p class="meta-text">{piece.section}</p>
						<span class="badge-muted">{piece.status}</span>
					</div>
					<h3 class="mt-5 font-display text-2xl font-bold leading-tight md:text-3xl">
						{piece.title}
					</h3>
					<p class="body-text mt-4 text-sm">{piece.dek}</p>
					<div class="divider mt-6 pt-4">
						<p class="text-sm font-semibold">{piece.byline}</p>
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>

<section class="border-y border-accent-red bg-journal-text text-journal-bg dark:bg-journal-text-dark dark:text-journal-bg-dark">
	<div class="container grid gap-8 py-12 md:grid-cols-[0.9fr_1.1fr] md:items-start">
		<div>
			<p class="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">Why it matters</p>
			<h2 class="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
				This is how motivated students stand out.
			</h2>
		</div>
		<div class="grid gap-6 sm:grid-cols-2">
			<div class="border-t border-journal-bg/40 pt-4 dark:border-journal-bg-dark/40">
				<h3 class="font-semibold">Bring a real question</h3>
				<p class="mt-2 text-sm leading-relaxed opacity-80">
					Not “I like politics.” Try: who loses when a local service disappears, and why did no
					one notice?
				</p>
			</div>
			<div class="border-t border-journal-bg/40 pt-4 dark:border-journal-bg-dark/40">
				<h3 class="font-semibold">Produce evidence admissions tutors can understand</h3>
				<p class="mt-2 text-sm leading-relaxed opacity-80">
					Edited writing shows initiative, judgement, and follow-through better than another
					claim about being passionate.
				</p>
			</div>
			<div class="border-t border-journal-bg/40 pt-4 dark:border-journal-bg-dark/40">
				<h3 class="font-semibold">Write like someone expects to be read</h3>
				<p class="mt-2 text-sm leading-relaxed opacity-80">
					No padded paragraphs. No borrowed certainty. Clear claims, clean structure, better
					sentences.
				</p>
			</div>
			<div class="border-t border-journal-bg/40 pt-4 dark:border-journal-bg-dark/40">
				<h3 class="font-semibold">Publish for people, not prestige</h3>
				<p class="mt-2 text-sm leading-relaxed opacity-80">
					Open-access media matters because serious writing should reach classmates, parents,
					teachers, neighbours, and local readers too.
				</p>
			</div>
		</div>
	</div>
</section>

<section class="container py-14">
	<div class="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
		<div>
			<p class="meta-text">What students gain</p>
			<h2 class="heading-2 mt-3">Something better than saying you are “passionate.”</h2>
			<p class="body-text mt-4">
				Strong applications show movement: a question pursued, a draft improved, a claim
				sharpened, a piece finished. Dialogue helps students build exactly that trail.
			</p>
		</div>
		<div class="grid gap-3">
			{#each outcomes as outcome}
				<div class="flex gap-4 border-t border-journal-border py-4 dark:border-journal-border-dark">
					<span class={`mt-1 h-3 w-3 shrink-0 ${outcome.colour}`}></span>
					<p class="font-semibold leading-snug">{outcome.text}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="border-y border-journal-border bg-accent-red/[0.055] dark:border-journal-border-dark dark:bg-accent-red/[0.08]">
	<div class="container grid gap-8 py-12 md:grid-cols-[0.9fr_1.1fr]">
		<div>
			<p class="meta-text">Who should apply</p>
			<h2 class="heading-2 mt-3">You do not need a perfect CV. You need a live mind.</h2>
			<p class="body-text mt-4">
				We are looking for students who read, notice, ask awkward questions, and want their
				work to be taken seriously. Prior publication helps, but it is not the point. A live
				question and a willingness to be challenged matter more.
			</p>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="card border-accent-yellow/50 bg-accent-yellow/[0.12]">
				<p class="meta-text">We value</p>
				<h3 class="heading-3 mt-2">Intellectual restlessness</h3>
				<p class="body-text mt-2 text-sm">
					The student who underlines an article, argues with it, and then wants to find out
					what is missing.
				</p>
			</div>
			<div class="card border-accent-blue/40 bg-accent-blue/[0.08]">
				<p class="meta-text">We build</p>
				<h3 class="heading-3 mt-2">Editorial discipline</h3>
				<p class="body-text mt-2 text-sm">
					The habits that turn intelligence into readable work: structure, evidence, revision,
					and respect for the reader.
				</p>
			</div>
		</div>
	</div>
</section>

<section class="container py-14">
	<div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
		<div>
			<p class="meta-text">What happens inside</p>
			<h2 class="heading-2 mt-3">From raw idea to edited article.</h2>
			<p class="body-text mt-4">
				The public site tells you what the scheme is for. The editorial work itself happens in
				a private space, where students pitch, draft, receive feedback, and revise.
			</p>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<article class="card border-accent-red/35 bg-accent-red/[0.06]">
				<p class="meta-text">01 / Orientation</p>
				<h3 class="heading-3 mt-2">Choose a territory</h3>
				<p class="body-text mt-2 text-sm">
					Pick the themes you genuinely want to understand: politics, economics, culture,
					technology, place, institutions, power.
				</p>
			</article>
			<article class="card border-accent-yellow/50 bg-accent-yellow/[0.12]">
				<p class="meta-text">02 / Ideas</p>
				<h3 class="heading-3 mt-2">Make the idea specific</h3>
				<p class="body-text mt-2 text-sm">
					Turn “I care about inequality” into a story with a place, a person, a question, and
					a reason to read.
				</p>
			</article>
			<article class="card border-accent-blue/35 bg-accent-blue/[0.06]">
				<p class="meta-text">03 / Drafting</p>
				<h3 class="heading-3 mt-2">Write the piece</h3>
				<p class="body-text mt-2 text-sm">
					Build the argument, report what you can, cut what is vague, and give the reader a
					reason to stay with you.
				</p>
			</article>
			<article class="card border-emerald-700/35 bg-emerald-700/[0.06]">
				<p class="meta-text">04 / Editing</p>
				<h3 class="heading-3 mt-2">Take the edit</h3>
				<p class="body-text mt-2 text-sm">
					An editor pushes the work: sharper claim, stronger evidence, cleaner prose, better
					ending.
				</p>
			</article>
		</div>
	</div>
</section>

<section class="container pb-16">
	<div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
		<div>
			<p class="meta-text">Editorial standards</p>
			<h2 class="heading-2 mt-3">Before an editor says yes.</h2>
			<p class="body-text mt-4">
				A good idea has to earn its space. These are the questions that turn a draft from
				interesting to worth reading.
			</p>
		</div>
		<div class="divide-y divide-journal-border border-y border-journal-border dark:divide-journal-border-dark dark:border-journal-border-dark">
			{#each standards as standard}
				<div class="grid gap-3 py-4 sm:grid-cols-[48px_1fr] sm:items-center">
					<span class="flex h-8 w-8 items-center justify-center bg-accent-red font-display text-xl font-bold text-white">•</span>
					<p class="font-semibold">{standard}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="container pb-16">
	<div class="grid gap-6 md:grid-cols-3">
		<div class="border-t-4 border-accent-red bg-accent-red/[0.06] p-5">
			<span class="meta-text">For students</span>
			<h2 class="heading-2 mt-2">A place to do serious work</h2>
			<p class="body-text mt-2">
				Pitch, draft, revise, and leave with work that shows more than potential.
			</p>
		</div>
		<div class="border-t-4 border-accent-yellow bg-accent-yellow/[0.12] p-5">
			<span class="meta-text">For editors</span>
			<h2 class="heading-2 mt-2">Sharper feedback</h2>
			<p class="body-text mt-2">
				Editors push assigned students on argument, evidence, structure, and voice.
			</p>
		</div>
		<div class="border-t-4 border-accent-blue bg-accent-blue/[0.06] p-5">
			<span class="meta-text">For staff</span>
			<h2 class="heading-2 mt-2">A protected programme</h2>
			<p class="body-text mt-2">
				Teachers and administrators support the scheme without exposing private editorial work.
			</p>
		</div>
	</div>
</section>

<section class="container pb-20">
	<div class="bg-accent-red px-6 py-8 text-white md:px-10">
		<div class="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">Applications</p>
				<h2 class="mt-2 font-display text-3xl font-bold leading-tight md:text-4xl">
					Bring an argument. Leave with edited work.
				</h2>
				<p class="mt-4 max-w-2xl text-base leading-relaxed opacity-80">
					If you are the student who keeps seeing the argument underneath the headline, this
					is where you learn to write it properly. The prize is not a badge. It is edited work,
					a sharper mind, and a stronger story about what you can do.
				</p>
			</div>
			<a class="inline-flex items-center justify-center bg-journal-bg px-5 py-3 text-sm font-semibold tracking-wide text-journal-text hover:opacity-80 dark:bg-journal-bg-dark dark:text-journal-text-dark" href="/auth/signup">
				Apply as a student
			</a>
		</div>
		<div class="mt-6">
			<a
				class="inline-flex items-center justify-center bg-journal-text px-5 py-3 text-sm font-semibold tracking-wide text-white hover:opacity-85 dark:bg-journal-bg-dark"
				href="/parents-teachers"
			>
				Information for parents and teachers
			</a>
		</div>
	</div>
</section>
