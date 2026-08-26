/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        encre: '#0E1A24',
        meta: '#5F6B73',
        papier: { DEFAULT: '#FAF8F4', 100: '#F4F1EA', 200: '#ECE8DE' },
        foret: { DEFAULT: '#3F8A3D', deep: '#2A5C29', soft: '#6FA86D', tint: '#EAF1E9' },
        saphir: { DEFAULT: '#1B5F8C', deep: '#0E3D5C', soft: '#4E83AB', tint: '#E6EDF3' },
        ambre: { DEFAULT: '#C77A21', deep: '#96580F', soft: '#E0A461', tint: '#F8EFE2' },
        brique: { DEFAULT: '#B4452F', deep: '#8A3120', soft: '#D0806E', tint: '#F8EAE6' },
        ardoise: { DEFAULT: '#44606E', deep: '#2C444F', soft: '#6E8A97', tint: '#E8EEF1' },
        prune: { DEFAULT: '#6B4C8A', deep: '#4C3363', soft: '#9277AE', tint: '#F0EBF5' },
      },
      borderRadius: { fenetre: '36px', carte: '28px', pilule: '999px' },
      boxShadow: {
        fenetre: '0 50px 120px -40px rgba(14,26,36,0.35)',
        carte: '0 24px 60px -30px rgba(14,26,36,0.28)',
        pilule: '0 1px 2px rgba(14,26,36,0.06)',
        bulle: '0 12px 30px -14px rgba(14,26,36,0.28)',
        interne: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
    },
  },
  plugins: [],
}
