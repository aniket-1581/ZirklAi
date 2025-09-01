/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all of your component files.
    content: ["./App.tsx",  "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: '#007AFF',
                secondary: '#5856D6',
                textPrimary: '#000000',
                textSecondary: '#6B7280',
                textLink: '#007AFF',
                inputBorder: '#E5E7EB',
                inputBackground: '#FFFFFF'
            },
            fontFamily: {
                'sans': ['KoPubBatang', 'System'],
            }
        },
    },
    plugins: [],
}