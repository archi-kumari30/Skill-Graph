/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFDFD',
          100: '#FAF9F6', // Soft Warm Cream surface background
          200: '#F5F2EB',
          300: '#EAE5D9',
          400: '#D9D0BE',
          500: '#C3B397',
        },
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c7ff',
          400: '#85a3ff',
          500: '#4f75ff', // Primary action Indigo
          600: '#2b4cff',
          700: '#1a33eb',
          800: '#152bc2',
          950: '#0b0f19'
        },
        growth: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          500: '#8b5cf6', // Learning Purple
          600: '#7c3aed',
          700: '#6d28d9'
        },
        readiness: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#0d9488', // Teal
          600: '#0f766e'
        },
                coral: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e', // Gap warning coral
          600: '#e11d48'
        },
        // Flat overrides for custom color palette codes
        'indigo-50/50': 'rgba(238, 242, 255, 0.5)',
        'indigo-150': '#e0e7ff',
        'indigo-250': '#c7d2fe',
        'indigo-650': '#4f46e5',
        'indigo-750': '#4338ca',
        'indigo-650/10': 'rgba(79, 70, 229, 0.10)',
        'indigo-650/15': 'rgba(79, 70, 229, 0.15)',
        'indigo-650/20': 'rgba(79, 70, 229, 0.20)',
        'slate-150': '#f1f5f9',
        'slate-205': '#cbd5e1',
        'slate-250': '#cbd5e1',
        'slate-450': '#94a3b8',
        'slate-505': '#64748b',
        'slate-550': '#64748b',
        'slate-650': '#475569',
        'slate-750': '#334155',
        'slate-850': '#1e293b',
        'slate-855': '#0f172a',
        'purple-650': '#7c3aed',
        'rose-750': '#be123c',
        'rose-850': '#9f1239',
        'emerald-150': '#d1fae5',
        'emerald-750': '#047857'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float-delayed 7s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'draw-line': 'draw-line 2.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'draw-line': {
          'to': { strokeDashoffset: '0' }
        }
      }
    },
  },
  plugins: [],
}
