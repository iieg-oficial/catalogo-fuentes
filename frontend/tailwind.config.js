/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f3ebf6',
          100: '#e4d0ed',
          500: '#7a3a96',
          600: '#5C2472',
          700: '#4a1d5e',
          900: '#3a1550',
        },
        accent: {
          DEFAULT: '#FF8300',
          hover:   '#e67600',
          light:   '#fff4e6',
        },
        // brand-tinted neutral scale; Tailwind gray-* is kept for stock grays where
        // precise neutral (non-tinted) values are needed in shared components.
        neutral: {
          50:  '#f3f4f6',
          100: '#ede8f1',
          200: '#d1d5db',
          300: '#bab5c0',
          400: '#6b7280',
          500: '#465055',
          600: '#4a4255',
          700: '#383246',
          800: '#272035',
          900: '#1f2937',
        },
        error: {
          50:  '#fef2f2',
          200: '#fecaca',
          600: '#dc2626',
        },
      },
    },
  },
  plugins: [],
}
