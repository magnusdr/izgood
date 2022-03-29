import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import { terser } from "rollup-plugin-terser";

const packageJson = require("./package.json");

export default [
  {
    input: "izgood.tsx",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      terser(),
    ],
  },
  {
    input: "dist/esm/types/izgood.d.ts",
    output: [{ file: "dist/izgood.d.ts", format: "esm" }],
    plugins: [dts()],
  },
];
