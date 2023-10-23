import { defineConfig } from "rollup";
import sourcemaps from "rollup-plugin-sourcemaps";
import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import sizes from "@atomico/rollup-plugin-sizes";
import autoExternal from "rollup-plugin-auto-external";
import css from "rollup-plugin-import-css";

export default defineConfig({
  input: "src/index.ts",
  output: [
    {
      name: "@an/tiptap-starter-kit",
      dir: "dist/umd",
      format: "umd",
      sourcemap: true,
    },
    {
      name: "@an/tiptap-starter-kit",
      dir: "dist/cjs",
      format: "cjs",
      sourcemap: true,
      exports: "auto",
    },
    {
      name: "@an/tiptap-starter-kit",
      inlineDynamicImports: true,
      dir: "dist/esm",
      format: "es",
      sourcemap: true,
    },
  ],
  plugins: [
    css(),
    autoExternal({
      packagePath: "package.json",
    }),
    sourcemaps(),
    resolve(),
    commonjs(),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
    }),
    sizes(),
    typescript({
      tsconfig: "../../tsconfig.json",
      tsconfigOverride: {
        compilerOptions: {
          declaration: true,
          paths: {
            "@an/*": ["packages/*/src"],
          },
        },
        include: null,
      },
    }),
  ],
  external: [
    "some-externally-required-library",
    // fileURLToPath(new URL("src/some-local-file-that-should-not-be-bundled.js", import.meta.url)),
    /node_modules/,
  ],
});
