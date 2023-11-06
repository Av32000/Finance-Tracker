import type { Config } from 'tailwindcss';

export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		colors: {
			'bg-dark': '#11182C',
			bg: '#1B233A',
			'bg-light': '#222940',
			'text-color': '#9CA3AF',
			'active-text-color': '#E4E9F1',
			green: '#25B14C',
			red: '#B12525',
			'cta-primarly': '#6366F1',
			transparent: 'transparent',
		},
	},
	plugins: [],
} satisfies Config;
