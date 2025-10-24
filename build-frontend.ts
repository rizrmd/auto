#!/usr/bin/env bun
/**
 * Frontend Build Script
 *
 * Bundles TypeScript/React frontend for production
 * Uses Bun's native bundler
 */

import { rm, copyFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import plugin from "bun-plugin-tailwind";

const FRONTEND_DIR = path.resolve(import.meta.dir, "frontend");
const OUTPUT_DIR = path.resolve(import.meta.dir, "frontend/dist");
const ENTRY_POINT = path.join(FRONTEND_DIR, "frontend.tsx");
const HTML_SOURCE = path.join(FRONTEND_DIR, "index.html");
const HTML_TARGET = path.join(OUTPUT_DIR, "index.html");

console.log("🏗️  Building AutoLeads Frontend...\n");
console.log(`📂 Frontend: ${FRONTEND_DIR}`);
console.log(`📂 Output: ${OUTPUT_DIR}`);
console.log(`📄 Entry: ${ENTRY_POINT}\n`);

// Check if entry point exists
if (!existsSync(ENTRY_POINT)) {
  console.error(`❌ Entry point not found: ${ENTRY_POINT}`);
  process.exit(1);
}

// Check if HTML source exists
if (!existsSync(HTML_SOURCE)) {
  console.error(`❌ HTML source not found: ${HTML_SOURCE}`);
  process.exit(1);
}

// Clean output directory
if (existsSync(OUTPUT_DIR)) {
  console.log("🧹 Cleaning output directory...");
  await rm(OUTPUT_DIR, { recursive: true, force: true });
}

const startTime = performance.now();

try {
  // Build frontend with Bun and Tailwind
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
    plugins: [plugin],
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

  // Copy HTML file to dist directory
  console.log("📄 Copying HTML file...");
  await copyFile(HTML_SOURCE, HTML_TARGET);

  // Update HTML with correct asset paths
  const htmlContent = await Bun.file(HTML_TARGET).text();

  // Find the generated CSS and JS files
  const cssFile = result.outputs.find(o => o.path.endsWith('.css'));
  const jsFile = result.outputs.find(o => o.path.endsWith('.js'));

  if (cssFile && jsFile) {
    const cssName = path.basename(cssFile.path);
    const jsName = path.basename(jsFile.path);

    // Update HTML to reference the correct files
    const updatedHtml = htmlContent
      .replace('<link rel="stylesheet" href="./index.css" />', `<link rel="stylesheet" href="/${cssName}" />`)
      .replace('<script type="module" src="./frontend.tsx"></script>', `<script type="module" src="/${jsName}"></script>`);

    await Bun.write(HTML_TARGET, updatedHtml);
    console.log(`   Updated HTML with ${cssName} and ${jsName}`);
  }

  // Print output files
  console.log("📄 Generated files:");
  for (const output of result.outputs) {
    const size = (output.size / 1024).toFixed(2);
    const relativePath = path.relative(OUTPUT_DIR, output.path);
    console.log(`   ${relativePath} (${size} KB)`);
  }
  console.log(`   index.html`);

  console.log("\n✨ Frontend build complete! Ready to serve.\n");
} catch (error) {
  console.error("❌ Build error:", error);
  process.exit(1);
}
