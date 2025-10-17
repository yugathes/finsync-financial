// CommonJS PostCSS config so PostCSS/Tailwind can be loaded in ESM projects and CI
module.exports = {
  plugins: {
    // Explicitly point tailwind to the CommonJS config file used in CI builds
    'tailwindcss': { config: './tailwind.config.cjs' },
    'autoprefixer': {},
  },
};
