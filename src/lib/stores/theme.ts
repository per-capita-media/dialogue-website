import { writable } from 'svelte/store';

const initial =
	typeof window !== 'undefined' ? localStorage.getItem('theme') ?? 'light' : 'light';

export const theme = writable<string>(initial);

if (typeof window !== 'undefined') {
	theme.subscribe((value) => {
		localStorage.setItem('theme', value);
		if (value === 'dark') document.documentElement.classList.add('dark');
		else document.documentElement.classList.remove('dark');
	});
}
