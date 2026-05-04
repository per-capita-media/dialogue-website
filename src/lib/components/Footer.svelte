<script lang="ts">
	const year = new Date().getFullYear();
</script>

<footer class="border-t border-journal-border dark:border-journal-border-dark mt-20">
	<div class="container py-10">
		<div class="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
			<div class="flex max-w-2xl gap-4">
				<img
					src="/per-capita-logo.jpg"
					alt="Per Capita Media"
					class="h-16 w-16 shrink-0 rounded-sm object-cover"
				/>
				<div>
					<p class="font-display text-2xl font-bold leading-none">Dialogue</p>
					<p class="meta-text mt-2">Per Capita Media journalism scheme</p>
					<p class="body-text mt-3 max-w-xl text-sm">
						A selective role-based workspace for young journalists, teachers, editors, and
						programme administrators.
					</p>
				</div>
			</div>
			<nav class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm font-semibold md:text-right">
				<a class="hover:text-accent-red" href="/access/student">Student access</a>
				<a class="hover:text-accent-red" href="/access/teacher">Teacher access</a>
				<a class="hover:text-accent-red" href="/access/editor">Editor access</a>
				<a class="hover:text-accent-red" href="/access/admin">Admin access</a>
				<a class="hover:text-accent-red" href="/auth/login">Sign in</a>
				<a class="hover:text-accent-red" href="/auth/signup">Apply</a>
			</nav>
		</div>
		<div class="divider mt-8 pt-4">
			<p class="meta-text">(c) {year} Dialogue. Access is granted by programme role.</p>
		</div>
	</div>
</footer>
