/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#030718',
          card: 'rgba(13, 27, 72, 0.85)',
          border: 'rgba(96, 165, 250, 0.28)',
          glow: 'rgba(56, 189, 248, 0.55)',
        },
        electric: {
          blue: '#38bdf8',
          deep: '#0284c7',
        }
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)' },
          '50%': { boxShadow: '0 0 35px rgba(56, 189, 248, 0.65)' },
        }
      }
    },
  },
  plugins: [],
}
