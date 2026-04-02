/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0b10',
        panel: '#12141d',
        accent: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          glow: 'rgba(59, 130, 246, 0.5)',
        },
        surface: {
          low: '#1a1d28',
          mid: '#242838',
          high: '#2d3348',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glow-gradient': 'linear-gradient(135deg, #12141d 0%, #1a1d28 100%)',
        'active-gradient': 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.15)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.15)',
      }
    },
  },
  plugins: [],
};
