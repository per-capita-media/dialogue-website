/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			fontFamily: {
				sans: ['"Manrope"', 'Avenir Next', 'system-ui', 'sans-serif'],
				display: ['"Playfair Display"', 'Georgia', 'serif']
			},
			colors: {
				accent: {
					red: '#8F1D1D',
					blue: '#1F3F5B',
					yellow: '#B8913B'
				},
				journal: {
					bg: '#FDFBF7',
					'bg-dark': '#161412',
					surface: '#FFFFFF',
					'surface-dark': '#211E1A',
					border: '#D8D0C4',
					'border-dark': '#443C33',
					text: '#141414',
					'text-dark': '#F2EEE7',
					muted: '#675F55',
					'muted-dark': '#B9B0A5'
				}
			},
			container: {
				center: true,
				padding: '1.5rem'
			}
		}
	},
	plugins: [require('@tailwindcss/typography')]
};
