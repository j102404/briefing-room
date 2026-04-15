import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070f1e',
          900: '#0a1628',
          800: '#121e37',
          700: '#1a2a47',
          600: '#243a5e',
          500: '#2e4b78',
        },
        gold: {
          300: '#f7d98a',
          400: '#f4c55a',
          500: '#E8A838',
          600: '#c98d2a',
          700: '#a5721e',
        },
      },
      fontFamily: {
        display: ['var(--font-sora)', 'sans-serif'],
        body: ['var(--font-manrope)', 'sans-serif'],
      },
      animation: {
        'fade-slide-in': 'fadeSlideIn 0.6s ease forwards',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        fadeSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
