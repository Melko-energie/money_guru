/** @type {import('tailwindcss').Config} */

/*
 * Charte relevée au pixel sur Template/T2.png — cinq couleurs :
 *   #D9EDF4 blanc glacé · #74B5D5 bleu · #767D2F olive · #2F370E olive profond · #27282A noir
 * Les neutres de structure (fond de page, cartes) viennent du layout Template/T1.png,
 * légèrement teintés vers le glacé pour rester dans la même famille.
 * `alerte` et `succes` sont les deux seules teintes hors nuancier : le nuancier T2 ne
 * contient ni rouge ni vert franc, et les états d'erreur et de réussite en ont besoin.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        /* ——— charte T2 ——— */
        encre: { DEFAULT: '#27282A', soft: '#4A4C4F', mute: '#6E7276' },
        meta: '#7A7E82',
        glace: { DEFAULT: '#D9EDF4', 100: '#ECF6FA', 200: '#C4E2ED' },
        ciel: { DEFAULT: '#74B5D5', deep: '#3F7B9E', soft: '#9DCBE3', tint: '#E7F3F8' },
        olive: { DEFAULT: '#767D2F', deep: '#2F370E', soft: '#A8B457', tint: '#F0F2E2' },

        /* ——— neutres de structure (layout T1) ——— */
        papier: { DEFAULT: '#F1F4F5', 100: '#E8EDEF', 200: '#DCE4E7' },

        /* ——— états : seules teintes ajoutées hors nuancier T2 ——— */
        alerte: { DEFAULT: '#B4452F', deep: '#8A3120', soft: '#D0806E', tint: '#F8EAE6' },
        succes: { DEFAULT: '#2E7D5B', deep: '#1F5940', soft: '#6FAE93', tint: '#E6F2ED' },

        /*
         * Alias hérités — une teinte par catégorie financière, toutes dérivées de T2.
         * Ils gardent les anciens noms pour que le lot L1 repeigne l'application sans
         * toucher un seul composant ; ils seront renommés puis retirés au lot L3.
         */
        ardoise: { DEFAULT: '#4A6E7C', deep: '#2F4A55', soft: '#7C9AA6', tint: '#E9EFF2' }, // maintenance
        foret: { DEFAULT: '#767D2F', deep: '#4E5A1C', soft: '#A8B457', tint: '#F0F2E2' }, // fonds d'urgence
        brique: { DEFAULT: '#B4452F', deep: '#8A3120', soft: '#D0806E', tint: '#F8EAE6' }, // dettes
        saphir: { DEFAULT: '#3D470F', deep: '#2F370E', soft: '#6B7530', tint: '#EDEFE0' }, // capital productif
        prune: { DEFAULT: '#74B5D5', deep: '#3F7B9E', soft: '#9DCBE3', tint: '#E7F3F8' }, // objectifs
        ambre: { DEFAULT: '#A8B457', deep: '#767D2F', soft: '#C6CE93', tint: '#F5F7EA' }, // fun money
      },
      borderRadius: { carte: '28px', pilule: '999px' },
      boxShadow: {
        fenetre: '0 50px 120px -40px rgba(39,40,42,0.30)',
        carte: '0 24px 60px -30px rgba(39,40,42,0.24)',
        pilule: '0 1px 2px rgba(39,40,42,0.06)',
        bulle: '0 12px 30px -14px rgba(39,40,42,0.26)',
        interne: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
    },
  },
  plugins: [],
}
