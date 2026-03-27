/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // SkillChain Design System
        sc: {
          bg: '#0F172A',
          card: '#1E293B',
          card2: '#273548',
          surface: '#334155',
          border: '#334155',
        },
        primary: '#6366F1',
        'primary-light': '#818CF8',
        'primary-dark': '#4F46E5',
        accent: '#22C55E',
        'accent-light': '#4ADE80',
        secondary: '#06B6D4',
        'secondary-light': '#22D3EE',
        light_text: '#F1F5F9',
        muted_text: '#94A3B8',
        // Legacy compat
        background: '#0F172A',
        surface: '#1E293B',
        surface_container: '#273548',
        aurora: '#6366F1',
        neon: '#22C55E',
        cyber: '#06B6D4',
        mint: '#22C55E',
        cyber_violet: '#6366F1',
        primary_glow: '#6366F1',
      },
      boxShadow: {
        glow: '0 8px 32px rgba(99, 102, 241, 0.25)',
        card: '0 4px 24px rgba(0, 0, 0, 0.3)',
        'glow-green': '0 8px 32px rgba(34, 197, 94, 0.2)',
        'glow-lg': '0 12px 48px rgba(99, 102, 241, 0.35)',
      },
      backdropBlur: {
        xs: '2px',
        glass: '20px',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
