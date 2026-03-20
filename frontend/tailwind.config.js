/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        midnight: '#0b1021',
        sapphire: '#1a2b4b',
        aurora: '#7c3aed',
        neon: '#4ade80',
        cyber: '#22d3ee',
      },
      boxShadow: {
        glow: '0 10px 40px rgba(88, 28, 135, 0.35)',
        card: '0 12px 35px rgba(0,0,0,0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
    },
  },
  plugins: [],
}

