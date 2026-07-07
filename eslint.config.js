// Flat ESLint config. Plain-JS app (browser) + module scripts/tests (Node).
export default [
  {
    files: ["app.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        window: "readonly", document: "readonly", localStorage: "readonly",
        navigator: "readonly", location: "readonly", history: "readonly",
        matchMedia: "readonly", setTimeout: "readonly", clearTimeout: "readonly",
        requestAnimationFrame: "readonly", FileReader: "readonly", Blob: "readonly",
        URL: "readonly", TextEncoder: "readonly", TextDecoder: "readonly",
        btoa: "readonly", atob: "readonly", Event: "readonly", console: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-var": "error",
      "prefer-const": "warn",
      "eqeqeq": ["warn", "smart"],
      "no-implicit-globals": "error",
      "no-shadow-restricted-names": "error",
    },
  },
  {
    files: ["scripts/**/*.mjs", "tests/**/*.mjs", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        process: "readonly", console: "readonly", URL: "readonly",
        setTimeout: "readonly", Buffer: "readonly",
        // Browser globals below are referenced inside Playwright page.evaluate()
        // callbacks, which execute in the browser, not Node.
        document: "readonly", window: "readonly", navigator: "readonly",
        getComputedStyle: "readonly", fetch: "readonly", Event: "readonly",
        localStorage: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
