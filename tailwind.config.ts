import type { Config } from 'tailwindcss'

export default {
  content: [
    './frontend/**/*.{js,ts,jsx,tsx}',
    './frontend/**/*.{html}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config