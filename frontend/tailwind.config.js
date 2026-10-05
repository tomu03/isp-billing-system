/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace']
      },
      colors: {
        ink: {
          950: '#0B1210',
          900: '#0F1B17',
          800: '#152620',
          700: '#1D342B',
          600: '#2A4A3C'
        },
        signal: {
          DEFAULT: '#2FBF8F',
          light: '#5FE3B4',
          dark: '#1E9670'
        },
        amber: {
          DEFAULT: '#E8A33D'
        },
        rose: {
          DEFAULT: '#E8615A'
        },
        paper: '#F6F7F5',
        line: '#E4E7E2'
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,27,23,0.06), 0 1px 0 rgba(15,27,23,0.04)'
      }
    }
  },
  plugins: []
};
