import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10172A',
        slate: {
          850: '#172033',
        },
        accent: {
          DEFAULT: '#4F46E5',
          dark: '#3F37C9',
          soft: '#EEF0FF',
        },
        line: '#D7DCE5',
        surface: '#F7F8FB',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 23, 42, 0.06), 0 1px 1px 0 rgba(16, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
