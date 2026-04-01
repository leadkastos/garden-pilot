/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        garden: {
          50:  '#f4f9f1',
          100: '#e6f2e0',
          200: '#cce4c1',
          300: '#a5cf96',
          400: '#74b363',
          500: '#4e9640',
          600: '#3a7a2e',
          700: '#2e6025',
          800: '#264d1f',
          900: '#1d3a17',
          950: '#0e1f0b',
        },
        soil: {
          50:  '#faf7f2',
          100: '#f2ebe0',
          200: '#e4d5be',
          300: '#d2b994',
          400: '#be9868',
          500: '#b08050',
          600: '#9a6b42',
          700: '#7f5437',
          800: '#694530',
          900: '#573a2b',
        },
        cream: '#fdfcf8',
        parchment: '#f6f3ec',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'nav': '0 1px 0 rgba(0,0,0,0.06)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
