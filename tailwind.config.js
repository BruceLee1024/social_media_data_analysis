/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'text-cyan-400',
    'text-blue-400',
    'text-indigo-400',
    'text-purple-400',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
