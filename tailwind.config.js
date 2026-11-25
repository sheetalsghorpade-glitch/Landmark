/** @type {import('tailwindcss').Config} */
// Every colour maps to a CSS variable defined in src/index.css, so the three
// brand variations (green, yellow, blue) swap with one attribute on <html>.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: v('ink'), 2: v('ink-2'), 3: v('ink-3'), faint: v('ink-faint') },
        canvas: v('canvas'),
        select: v('select'),
        hair: { DEFAULT: v('hair'), strong: v('hair-strong') },
        sidebar: v('sidebar'),
        primary: { DEFAULT: v('primary'), press: v('primary-press'), ink: v('primary-ink'), on: v('on-primary') },
        rag: { red: v('red'), amber: v('amber'), green: v('green') },
      },
      backgroundColor: {
        wash: 'var(--primary-wash)',
        'red-wash': 'var(--red-wash)',
        'amber-wash': 'var(--amber-wash)',
        'green-wash': 'var(--green-wash)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Roma text styles, read from the Figma file
        heading: ['32px', { lineHeight: '1.1', letterSpacing: '-0.74px', fontWeight: '500' }],
        sub: ['20px', { lineHeight: '1.2', letterSpacing: '-0.4px', fontWeight: '500' }],
        body: ['16px', { lineHeight: '1.4', letterSpacing: '-0.16px' }],
        sm: ['14px', { lineHeight: '1.4', letterSpacing: '-0.1px' }],
        cap: ['12px', { lineHeight: '1.4' }],
        label: ['12px', { lineHeight: '16px', fontWeight: '500' }],
        mono: ['12.5px', { lineHeight: '1.5' }],
        fig: ['24px', { lineHeight: '1.2', letterSpacing: '-0.4px' }],
        eyebrow: ['11px', { lineHeight: '1.4', letterSpacing: '1.54px', fontWeight: '500' }],
      },
      borderRadius: { xs: '4px', md: '6px', lg: '8px', xl: '12px' },
      boxShadow: {
        card: '0 2px 24px 0 rgba(5,5,5,0.08)',
        nav: '0 2px 6px 0 rgba(0,0,0,0.04), 0 1px 2px 0 rgba(0,0,0,0.06)',
        pop: '0 12px 40px -8px rgba(5,5,5,0.18), 0 2px 6px rgba(5,5,5,0.06)',
      },
    },
  },
  plugins: [],
}
