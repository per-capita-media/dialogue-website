<script lang="ts">
	import DashboardCard from '$lib/components/DashboardCard.svelte';
	import StageBadge from '$lib/components/StageBadge.svelte';
	import type { PageData } from './$types';
	export let data: PageData;

	$: pitchCount = data.pitches.filter(
		(p) => p.status === 'submitted' || p.status === 'selected' || p.status === 'rejected'
	).length;
	$: selectedCount = data.pitches.filter((p) => p.status === 'selected').length;
	$: a1 = data.articles.find((a) => a.article_number === 1);
	$: a2 = data.articles.find((a) => a.article_number === 2);
	$: pitchAccess = data.docPassed && data.webPassed;
</script>

<div class="flex items-center justify-between flex-wrap gap-3">
	<div>
		<h1 class="heading-1">Welcome back, {data.profile.full_name?.split(' ')[0] ?? 'student'}</h1>
		<p class="body-text mt-1">Themes: {data.themes.join(' · ')}</p>
	</div>
	<StageBadge stage={data.profile.current_stage} />
</div>

<div class="grid md:grid-cols-2 gap-4 mt-8">
	<DashboardCard
		title="Document"
		description="Read the primer and pass the quiz."
		href="/student/learning/document"
		actionLabel={data.docPassed ? 'Review' : 'Open'}
		status={data.docPassed ? 'done' : 'pending'}
	/>
	<DashboardCard
		title="Webinar"
		description="Watch the recording and pass the quiz."
		href="/student/learning/webinar"
		actionLabel={data.webPassed ? 'Review' : 'Open'}
		status={data.webPassed ? 'done' : data.docPassed ? 'pending' : 'locked'}
	/>
	<DashboardCard
		title="Pitches"
		description={`${pitchCount} of 5 submitted${selectedCount ? ` · ${selectedCount} selected` : ''}`}
		href={pitchAccess ? '/student/pitches' : '/student/learning/document'}
		actionLabel={pitchAccess ? 'Open pitches' : 'Finish learning first'}
		status={pitchCount === 5 ? 'done' : pitchAccess ? 'in-progress' : 'locked'}
	/>
	<DashboardCard
		title="Article 1"
		description={a1 ? `Status: ${a1.status}` : 'Will unlock after pitch selection.'}
		href="/student/articles/1"
		actionLabel={a1 ? 'Open' : 'Locked'}
		status={a1 ? (a1.status === 'approved' ? 'done' : 'in-progress') : 'locked'}
	/>
	<DashboardCard
		title="Article 2"
		description={a2 ? (a2.locked ? 'Locked' : `Status: ${a2.status}`) : 'Locked until Article 1 is complete.'}
		href="/student/articles/2"
		actionLabel={a2 && !a2.locked ? 'Open' : 'Locked'}
		status={a2 ? (a2.locked ? 'locked' : a2.status === 'approved' ? 'done' : 'in-progress') : 'locked'}
	/>
	<DashboardCard
		title="Messages"
		description="Talk to your editor or the programme team."
		href="/student/messages"
		status="in-progress"
	/>
</div>
