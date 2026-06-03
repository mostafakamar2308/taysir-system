import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["server.ts"],
  format: ["cjs"],
  outDir: "dist",
  clean: true,
  tsconfig: "tsconfig.server.json",
  noExternal: [/.*/], // bundle all imports
  external: ["bcrypt"], // keep native module external
  // Silence warnings about external deps
  silent: true,
  shims: true,
});
