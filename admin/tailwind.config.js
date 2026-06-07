/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#D4AF37',
                    glow: 'rgba(212, 175, 55, 0.5)',
                    dark: '#B8860B',
                    light: '#F0E68C',
                    orange: '#F7931E',
                },
                secondary: '#1A1A1A',
                accent: '#FF6B35',
                surface: '#F3F4F6',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Poppins', 'sans-serif'],
            },
            boxShadow: {
                'professional': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'professional-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                'glow': '0 0 20px rgba(212, 175, 55, 0.5)',
            },
        },
    },
    plugins: [],
}
