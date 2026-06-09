/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Garet', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        newsreader: ['"Newsreader"', '"EB Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50:  '#eef2f8',
          100: '#d9e1ee',
          200: '#b3c3dd',
          300: '#7a96be',
          400: '#4a6494',
          500: '#2e4372',
          600: '#2e4372',
          700: '#25365b',
          900: '#1a2a4a',
        },
        accent: {
          DEFAULT: '#FF8300',
          hover:   '#e67600',
          light:   '#FFEEDD',
        },
        teal: {
          DEFAULT: '#2B8A9A',
          light:   '#84E0F0',
        },
        neutral: {
          50:  '#FAFAFA',
          100: '#F8F8F8',
          200: '#d1d5db',
          300: '#bab5c0',
          400: '#6b7280',
          500: '#5B6670',
          600: '#465055',
          700: '#44465D',
          800: '#272035',
          900: '#191919',
        },
        error: {
          50:  '#fef2f2',
          200: '#fecaca',
          600: '#dc2626',
        },
        ink: '#1a1625',
      },
    },
  },
  plugins: [],
}
