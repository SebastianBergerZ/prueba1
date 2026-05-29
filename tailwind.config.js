/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bcfd',
          400: '#8098fb',
          500: '#6070f7',
          600: '#4a50ec',
          700: '#3d3fd1',
          800: '#3234a8',
          900: '#2d3185',
          950: '#1c1d52'
        },
        qanty: {
          red: '#f06a6a',
          orange: '#fd8c73',
          yellow: '#eed045',
          green: '#62d26f',
          teal: '#37c5ab',
          blue: '#4186e0',
          indigo: '#7b68ee',
          purple: '#aa62e3',
          pink: '#e8649a',
          sidebar: '#1e1f2e',
          'sidebar-hover': '#2d2e3e',
          'sidebar-active': '#3d3e5c'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        modal: '0 20px 60px rgba(0,0,0,0.2)',
        dropdown: '0 4px 24px rgba(0,0,0,0.12)'
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      }
    }
  },
  plugins: []
}
