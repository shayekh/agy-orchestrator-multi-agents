/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e8ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#1e1b4b',
        },
        neon: {
          cyan: '#00f3ff',
          pink: '#ff007f',
          purple: '#b000ff',
          amber: '#ffaa00',
          emerald: '#00ff88',
        },
        cyber: {
          dark: '#0a0a12',
          card: '#121220',
          border: '#2a2a44',
          accent: '#7928ca',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
        display: ['Space Grotesk', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 243, 255, 0.4), 0 0 40px rgba(0, 243, 255, 0.2)',
        'glow-pink': '0 0 20px rgba(255, 0, 127, 0.4), 0 0 40px rgba(255, 0, 127, 0.2)',
        'glow-purple': '0 0 20px rgba(176, 0, 255, 0.4), 0 0 40px rgba(176, 0, 255, 0.2)',
        'glow-amber': '0 0 20px rgba(255, 170, 0, 0.4), 0 0 40px rgba(255, 170, 0, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'float': 'float 4s infinite ease-in-out',
        'win-strike': 'winStrike 0.5s ease-out forwards',
        'ripple': 'ripple 0.6s linear',
        'shimmer': 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 15px rgba(0, 243, 255, 0.6))' },
          '50%': { filter: 'drop-shadow(0 0 25px rgba(255, 0, 127, 0.8))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        winStrike: {
          '0%': { transform: 'scaleX(0)', opacity: '0' },
          '100%': { transform: 'scaleX(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #0a0a12 0%, #171728 50%, #0a0a12 100%)',
        'neon-gradient': 'linear-gradient(90deg, #00f3ff 0%, #b000ff 50%, #ff007f 100%)',
      }
    },
  },
  plugins: [],
}
