import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated/vendor directories:
    "node_modules/**",
    "lib/generated/**",
  ]),
  {
    rules: {
      // Excalidraw, Socket.IO, and Prisma JSON payloads are inherently
      // dynamic. Allow `any` rather than fighting third-party types.
      "@typescript-eslint/no-explicit-any": "off",

      // Allow underscore-prefixed unused parameters (common in route handlers).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Keep hook dependency issues visible but non-blocking. Socket refs and
      // Excalidraw APIs intentionally use stable refs in several places.
      "react-hooks/exhaustive-deps": "warn",

      // These are noisy for this coursework project and do not affect runtime.
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",

      // The "setState in effect" warning fires for the canonical next-themes
      // mounted pattern and similar legitimate sync-from-props effects. Keep
      // it as a warning at most so it does not block typecheck/lint runs.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
