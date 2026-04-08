module.exports = {
  future: {
    // removeDeprecatedGapUtilities: true,
    // purgeLayersByDefault: true,
  },
  // Es importante que Tailwind sepa dónde buscar tus clases para no purgarlas.
  purge: ["./src/**/*.{js,jsx,ts,tsx,css}"],
  theme: {
    extend: {
      fontFamily: {
        // La clave "brookshire" generará la clase "font-brookshire"
        brookshire: ["var(--font-brookshire)"],

        // Alternativamente, si no usaras la variable CSS en el :root, sería así:
        // brookshire: ['"EFCO Brookshire"', 'sans-serif'],
      },
    },
  },
  variants: {},
  plugins: [],
};
