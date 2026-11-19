/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FAF8F5',
          100: '#F6F2EC',
          200: '#ECE4D7',
          300: '#DFD3C1',
          400: '#CEBC9F',
          500: '#BAA37F',
          600: '#9E8662',
          700: '#7E694A',
          800: '#5F4D35',
          900: '#3D3121',
        },
        champagne: {
          50: '#FDFCF9',
          100: '#F9F6EE',
          200: '#F3EBD9',
          300: '#EADBC1',
          400: '#DFCA9E',
          500: '#CFB37D',
          600: '#B6975D',
          700: '#927643',
          800: '#6E5730',
          900: '#47361E',
        },
        gold: {
          50: '#FCF9F2',
          100: '#F7F0DF',
          200: '#ECDCBC',
          300: '#DEC493',
          400: '#CFA869',
          500: '#BC8F42',
          600: '#9E7431',
          700: '#7E5B24',
          800: '#5F431A',
          900: '#3F2C10',
        },
        charcoal: {
          800: '#2A2521',
          900: '#1C1917',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'wedding': '0 10px 30px -5px rgba(188, 143, 66, 0.08), 0 4px 6px -2px rgba(42, 37, 33, 0.03)',
        'wedding-lg': '0 20px 40px -10px rgba(188, 143, 66, 0.12), 0 8px 12px -4px rgba(42, 37, 33, 0.04)',
      }
    },
  },
  plugins: [],
}
