/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Editorial admin palette — matches frontend branding
                ink: {
                    DEFAULT: '#0e0d0b',
                    soft: '#1a1815',
                },
                paper: {
                    DEFAULT: '#faf7f2',
                    soft: '#f4f0e8',
                },
                primary: {
                    DEFAULT: '#c9a961',
                    glow: 'rgba(201, 169, 97, 0.4)',
                    dark: '#9c7c3c',
                    light: '#e8d9b0',
                },
                accent: {
                    DEFAULT: '#2f4a3e',
                    light: '#3f6353',
                },
                copper: '#b8734a',
                secondary: '#0e0d0b',
                // Legacy aliases
                surface: '#F9FAFB',
                warm: '#faf7f2',
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
            },
            boxShadow: {
                'card': '0 1px 2px rgba(14, 13, 11, 0.05)',
                'card-hover': '0 8px 24px rgba(14, 13, 11, 0.08)',
                'glow': '0 0 20px rgba(201, 169, 97, 0.3)',
            },
            borderRadius: {
                'editorial': '2px',
            },
        },
    },
    plugins: [],
}
