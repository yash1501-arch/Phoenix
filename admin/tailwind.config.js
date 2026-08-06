/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                forest: {
                    DEFAULT: '#2f4a3d',
                    soft: '#3a5a4b',
                },
                mist: {
                    DEFAULT: '#faf7f1',
                    muted: '#ebe4d8',
                },
                ember: {
                    DEFAULT: '#c1622d',
                    hover: '#d4783f',
                    pressed: '#a04e22',
                },
                ink: {
                    DEFAULT: '#2b2b26',
                    muted: '#5c5a52',
                    faint: '#8a8578',
                },
                // Legacy aliases
                primary: {
                    DEFAULT: '#c1622d',
                    dark: '#a04e22',
                    light: '#e8d9b0',
                },
                accent: {
                    DEFAULT: '#2f4a3d',
                    light: '#3f6353',
                },
                paper: {
                    DEFAULT: '#faf7f2',
                    soft: '#f4f0e8',
                },
            },
            fontFamily: {
                sans: ['Karla', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                admin: '8px',
            },
        },
    },
    plugins: [],
};
