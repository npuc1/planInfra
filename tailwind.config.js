/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        maize: '#F59E0B',
        beans: '#B45309',
        wheat: '#FDE68A',
        rice: '#10B981',
      },
    },
  },
  plugins: [],
};
