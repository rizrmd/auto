#!/usr/bin/env bun
/**
 * Frontend Build Script
 *
 * Bundles TypeScript/React frontend for production
 * Uses Bun's native bundler
 */

import { rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const FRONTEND_DIR = path.resolve(import.meta.dir, "frontend");
const OUTPUT_DIR = path.resolve(import.meta.dir, "frontend/dist");
const ENTRY_POINT = path.join(FRONTEND_DIR, "frontend.tsx");

console.log("🏗️  Building AutoLeads Frontend...\n");
console.log(`📂 Frontend: ${FRONTEND_DIR}`);
console.log(`📂 Output: ${OUTPUT_DIR}`);
console.log(`📄 Entry: ${ENTRY_POINT}\n`);

// Check if entry point exists
if (!existsSync(ENTRY_POINT)) {
  console.error(`❌ Entry point not found: ${ENTRY_POINT}`);
  process.exit(1);
}

// Clean output directory
if (existsSync(OUTPUT_DIR)) {
  console.log("🧹 Cleaning output directory...");
  await rm(OUTPUT_DIR, { recursive: true, force: true });
}

const startTime = performance.now();

try {
  // Build frontend with Bun
  const result = await Bun.build({
    entrypoints: [ENTRY_POINT],
    outdir: OUTPUT_DIR,
    target: "browser",
    format: "esm",
    minify: process.env.NODE_ENV === "production",
    sourcemap: process.env.NODE_ENV === "production" ? "linked" : "inline",
    splitting: true,
    naming: {
      entry: "[dir]/[name].[hash].[ext]",
      chunk: "[name]-[hash].[ext]",
      asset: "[name]-[hash].[ext]"
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
    },
    external: [], // Bundle everything
  });

  if (!result.success) {
    console.error("❌ Build failed!\n");
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  // Build successful
  const duration = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ Build completed in ${duration}s`);
  console.log(`📦 Output: ${OUTPUT_DIR}\n`);

  // Print output files
  console.log("📄 Generated files:");
  for (const output of result.outputs) {
    const size = (output.size / 1024).toFixed(2);
    const relativePath = path.relative(OUTPUT_DIR, output.path);
    console.log(`   ${relativePath} (${size} KB)`);
  }

  console.log("\n✨ Frontend build complete! Ready to serve.\n");
} catch (error) {
  console.error("❌ Build error:", error);
  process.exit(1);
}
