/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base palette
        base: {
          DEFAULT: '#0E0E10',
          50:  '#1A1A1E',
          100: '#222226',
          200: '#2A2A2F',
          300: '#333338',
          400: '#3F3F46',
          500: '#52525B',
          600: '#71717A',
          700: '#A1A1AA',
          800: '#D4D4D8',
          900: '#F4F4F5',
        },
        teal: {
          DEFAULT: '#00D9B8',
          dim:    '#00B89C',
          muted:  '#00D9B820',
          border: '#00D9B840',
        },
        amber: {
          DEFAULT: '#F5A623',
          dim:    '#D4901E',
          muted:  '#F5A62320',
          border: '#F5A62340',
        },
        danger: {
          DEFAULT: '#EF4444',
          muted:  '#EF444420',
        },
        success: {
          DEFAULT: '#22C55E',
          muted:  '#22C55E20',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        sans:    ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      backgroundImage: {
        'grid-subtle': `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
    },
  },
  plugins: [],
}
