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
        neutral: {
          50:  '#f3f4f6',
          200: '#d1d5db',
          400: '#6b7280',
          500: '#465055',
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
