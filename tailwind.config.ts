import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './store/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0B0F14',
        panel: '#11161D',
        border: '#1E2630',
        primary: '#4F8CFF',
        muted: '#94A3B8'
      }
    }
  },
  plugins: []
};

export default config;
