/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // RGB channel tokens — opacity modifiers (/70) work in both themes
                stone: {
                    DEFAULT: 'rgb(var(--rgb-ink) / <alpha-value>)',
                    soft: 'rgb(var(--rgb-ink-soft) / <alpha-value>)',
                    elevated: 'rgb(var(--rgb-ink-elevated) / <alpha-value>)',
                },
                mist: {
                    DEFAULT: 'rgb(var(--rgb-mist) / <alpha-value>)',
                    muted: 'rgb(var(--rgb-mist-muted) / <alpha-value>)',
                    subtle: 'rgb(var(--rgb-mist-subtle) / <alpha-value>)',
                },
                panel: {
                    DEFAULT: 'rgb(var(--rgb-panel) / <alpha-value>)',
                    soft: 'rgb(var(--rgb-panel-soft) / <alpha-value>)',
                },
                cream: {
                    DEFAULT: 'rgb(var(--rgb-cream) / <alpha-value>)',
                },
                ember: {
                    DEFAULT: 'rgb(var(--rgb-ember) / <alpha-value>)',
                    bright: 'rgb(var(--rgb-ember-bright) / <alpha-value>)',
                    deep: 'rgb(var(--rgb-ember-deep) / <alpha-value>)',
                },
                moss: {
                    DEFAULT: 'rgb(var(--rgb-moss) / <alpha-value>)',
                    bright: 'rgb(var(--rgb-moss-bright) / <alpha-value>)',
                },
                ink: {
                    DEFAULT: 'rgb(var(--rgb-ink) / <alpha-value>)',
                    soft: 'rgb(var(--rgb-ink-soft) / <alpha-value>)',
                    subtle: 'rgb(var(--rgb-ink-elevated) / <alpha-value>)',
                },
                paper: {
                    DEFAULT: 'rgb(var(--rgb-mist) / <alpha-value>)',
                    elevated: 'rgb(var(--rgb-mist-subtle) / <alpha-value>)',
                    subtle: 'rgb(var(--rgb-mist-muted) / <alpha-value>)',
                },
                gold: {
                    DEFAULT: 'rgb(var(--rgb-ember) / <alpha-value>)',
                    bright: 'rgb(var(--rgb-ember-bright) / <alpha-value>)',
                    deep: 'rgb(var(--rgb-ember-deep) / <alpha-value>)',
                },
                copper: 'rgb(var(--rgb-ember-deep) / <alpha-value>)',
                forest: 'rgb(var(--rgb-moss) / <alpha-value>)',
                heading: 'var(--heading)',
                body: 'var(--text-on-light)',
                muted: {
                    DEFAULT: 'var(--muted)',
                    subtle: 'var(--text-subtle)',
                },
                midnight: 'rgb(var(--rgb-panel) / <alpha-value>)',
                ivory: 'rgb(var(--rgb-cream) / <alpha-value>)',
                sky: '#5E8FB9',
                ember_legacy: 'rgb(var(--rgb-ember) / <alpha-value>)',
                primary: {
                    DEFAULT: 'rgb(var(--rgb-ember) / <alpha-value>)',
                    glow: 'rgba(193, 98, 45, 0.3)',
                    dark: 'rgb(var(--rgb-ember-deep) / <alpha-value>)',
                    light: '#e8a878',
                },
                secondary: 'rgb(var(--rgb-panel) / <alpha-value>)',
                accent: 'rgb(var(--rgb-ember) / <alpha-value>)',
            },
            fontFamily: {
                display: ['Unbounded', 'system-ui', 'sans-serif'],
                heading: ['Unbounded', 'system-ui', 'sans-serif'],
                body: ['Karla', 'system-ui', 'sans-serif'],
                sans: ['Karla', 'system-ui', 'sans-serif'],
            },
            fontSize: {
                'display-xl': ['clamp(2.25rem, 6vw, 4.25rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
                'display-lg': ['clamp(1.75rem, 4vw, 3rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
                'display-md': ['clamp(1.35rem, 2.5vw, 2rem)', { lineHeight: '1.12', letterSpacing: '-0.015em' }],
                'display-sm': ['clamp(1.15rem, 1.5vw, 1.4rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
            },
            boxShadow: {
                'smoke': 'var(--shadow-smoke)',
                'card': 'var(--shadow-card)',
                'lift': 'var(--shadow-lift)',
                'overlay': 'var(--shadow-lift)',
                'ember': 'var(--shadow-ember)',
                'glass': 'var(--shadow-card)',
                'glass-lg': 'var(--shadow-lift)',
                'gold': 'var(--shadow-ember)',
                'gold-lg': 'var(--shadow-ember)',
                'soft': 'var(--shadow-smoke)',
                'soft-lg': 'var(--shadow-card)',
                'professional': 'var(--shadow-card)',
                'professional-lg': 'var(--shadow-lift)',
            },
            borderRadius: {
                'none': '0',
                'sm': '4px',
                'md': '8px',
                'lg': '12px',
                'full': '999px',
            },
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
                '26': '6.5rem',
                '30': '7.5rem',
            },
            transitionTimingFunction: {
                'quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
                'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
            keyframes: {
                'icon-wiggle': {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '25%': { transform: 'rotate(-8deg)' },
                    '75%': { transform: 'rotate(8deg)' },
                },
                'draw-line': {
                    '0%': { strokeDashoffset: '100' },
                    '100%': { strokeDashoffset: '0' },
                },
            },
            animation: {
                'icon-wiggle': 'icon-wiggle 0.5s ease-in-out',
            },
            container: {
                center: true,
                padding: {
                    DEFAULT: '1.25rem',
                    sm: '2rem',
                    lg: '3rem',
                },
            },
            letterSpacing: {
                'kicker': '0.14em',
            },
        },
    },
    plugins: [],
}
