/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Light theme: cream + forest + terracotta (CONTEXT.md)
                stone: {
                    DEFAULT: '#2f4a3d',
                    soft: '#3a5a4b',
                    elevated: '#253a31',
                },
                mist: {
                    DEFAULT: '#faf7f1',
                    muted: '#ebe4d8',
                    subtle: '#f3efe6',
                },
                ember: {
                    DEFAULT: '#c1622d',
                    bright: '#d4783f',
                    deep: '#a04e22',
                },
                moss: {
                    DEFAULT: '#2f4a3d',
                    bright: '#3d6352',
                },
                // Compat with existing classNames
                ink: {
                    DEFAULT: '#2f4a3d',
                    soft: '#3a5a4b',
                    subtle: '#253a31',
                },
                paper: {
                    DEFAULT: '#faf7f1',
                    elevated: '#f3efe6',
                    subtle: '#ebe4d8',
                },
                gold: {
                    DEFAULT: '#c1622d',
                    bright: '#d4783f',
                    deep: '#a04e22',
                },
                copper: '#a04e22',
                forest: '#2f4a3d',
                heading: '#2b2b26',
                body: '#2b2b26',
                muted: {
                    DEFAULT: '#5c5a52',
                    subtle: '#7a776c',
                },
                midnight: '#2f4a3d',
                ivory: '#faf7f1',
                sky: '#5E8FB9',
                ember_legacy: '#c1622d',
                primary: {
                    DEFAULT: '#c1622d',
                    glow: 'rgba(193, 98, 45, 0.3)',
                    dark: '#a04e22',
                    light: '#e8a878',
                },
                secondary: '#2f4a3d',
                accent: '#c1622d',
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
                'smoke': '0 1px 2px rgba(47, 74, 61, 0.06)',
                'card': '0 8px 24px rgba(47, 74, 61, 0.1)',
                'lift': '0 20px 48px rgba(47, 74, 61, 0.16)',
                'overlay': '0 32px 64px rgba(47, 74, 61, 0.22)',
                'ember': '0 8px 28px rgba(193, 98, 45, 0.3)',
                'glass': '0 8px 24px rgba(47, 74, 61, 0.1)',
                'glass-lg': '0 20px 48px rgba(47, 74, 61, 0.16)',
                'gold': '0 8px 28px rgba(193, 98, 45, 0.3)',
                'gold-lg': '0 12px 36px rgba(193, 98, 45, 0.35)',
                'soft': '0 1px 2px rgba(47, 74, 61, 0.06)',
                'soft-lg': '0 8px 24px rgba(47, 74, 61, 0.1)',
                'professional': '0 8px 24px rgba(47, 74, 61, 0.1)',
                'professional-lg': '0 20px 48px rgba(47, 74, 61, 0.16)',
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
