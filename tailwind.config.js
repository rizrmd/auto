import type { Config } from 'tailwindcss'

export default {
  content: [
    './frontend/**/*.{js,ts,jsx,tsx}',
    './frontend/**/*.{html}',
    './frontend/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config