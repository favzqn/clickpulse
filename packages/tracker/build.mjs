import { build } from "esbuild";
import { readFileSync } from "fs";
import { gzipSync } from "zlib";

async function main() {
  await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    minify: true,
    format: "iife",
    outfile: "dist/clickpulse.js",
    target: ["es2018"],
    sourcemap: false,
    define: {
      "process.env.NODE_ENV": '"production"',
    },
  });

  await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    minify: true,
    format: "esm",
    outfile: "dist/clickpulse.esm.js",
    target: ["es2018"],
    sourcemap: false,
  });

  const content = readFileSync("dist/clickpulse.js");
  const gzip = gzipSync(content);
  const sizeKB = (content.length / 1024).toFixed(2);
  const gzipKB = (gzip.length / 1024).toFixed(2);

  console.log(`clickpulse.js: ${sizeKB}KB (${gzipKB}KB gzipped)`);

  if (gzip.length > 5120) {
    console.warn("Warning: Script exceeds 5KB gzipped target!");
  } else {
    console.log("Script is under 5KB gzipped target");
  }
}

main().catch(console.error);
