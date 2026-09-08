import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// U+2014 EM DASH and U+2015 HORIZONTAL BAR, which render identically.
const EM_DASH = "[\\u2014\\u2015]";
const EM_DASH_MESSAGE =
  "Em dashes are not allowed in user-facing text. Use a hyphen, or run the value through stripEmDashes() from @/lib/em-dash.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Comments and other code that never renders are untouched; this only
      // covers JSX text and the string literals that feed into it.
      "no-restricted-syntax": [
        "error",
        {
          selector: `JSXText[value=/${EM_DASH}/]`,
          message: EM_DASH_MESSAGE,
        },
        {
          selector: `Literal[value=/${EM_DASH}/]`,
          message: EM_DASH_MESSAGE,
        },
        {
          selector: `TemplateElement[value.cooked=/${EM_DASH}/]`,
          message: EM_DASH_MESSAGE,
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
