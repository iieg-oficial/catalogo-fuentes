/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Garet', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#FDF8FF',
          100: '#F7F0FA',
          200: '#F0D0FD',
          300: '#C39AD3',
          400: '#CCB0D6',
          500: '#6E258B',
          600: '#5C2472',
          700: '#522067',
          900: '#44465D',
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
      },
    },
  },
  plugins: [],
}
