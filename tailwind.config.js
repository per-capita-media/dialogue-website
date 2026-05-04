/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			fontFamily: {
				sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
				display: ['"Rammetto One"', 'system-ui', 'sans-serif']
			},
			colors: {
				// Accent palette (Bauhaus highlights, used sparingly)
				accent: {
					red: '#FF4A1C',
					blue: '#1C4CBD',
					yellow: '#FFB800'
				},
				// Page palette (light + dark variants)
				journal: {
					bg: '#FFFFFF',
					'bg-dark': '#0A1629',
					surface: '#FFFFFF',
					'surface-dark': '#1A2A49',
					border: '#E5E7EB',
					'border-dark': '#1E3A5F',
					text: '#1A1A1A',
					'text-dark': '#E8E8E3',
					muted: '#6B7280',
					'muted-dark': '#94A3B8'
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
