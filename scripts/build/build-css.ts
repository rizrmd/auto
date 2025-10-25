#!/usr/bin/env bun

/**
 * Tailwind CSS Build Script
 *
 * This script builds Tailwind CSS with proper file watching for development
 */

import { watch } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSS_INPUT = join(__dirname, "..", "..", "frontend", "styles", "globals.css");
const CSS_OUTPUT = join(__dirname, "..", "..", "frontend", "dist", "index.css");

/**
 * Build Tailwind CSS
 */
function buildCSS() {
  try {
    console.log("🎨 Building Tailwind CSS...");

    // Use Tailwind CLI to build CSS
    const projectRoot = join(__dirname, "..", "..");
    execSync(`bunx tailwindcss -i ${CSS_INPUT} -o ${CSS_OUTPUT} --watch=false`, {
      stdio: "inherit",
      cwd: projectRoot
    });

    console.log("✅ Tailwind CSS built successfully");
  } catch (error) {
    console.error("❌ Error building Tailwind CSS:", error);
  }
}

/**
 * Watch mode for development
 */
function watchCSS() {
  console.log("👀 Watching for CSS changes...");

  // Watch the frontend/src directory for component changes
  const srcWatcher = watch(
    join(__dirname, "..", "..", "frontend", "src"),
    { recursive: true },
    (event, filename) => {
      if (filename && (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.jsx') || filename.endsWith('.tsx'))) {
        console.log(`📝 Component changed: ${filename}`);
        buildCSS();
      }
    }
  );

  // Watch the frontend/styles directory for CSS changes
  const stylesWatcher = watch(
    join(__dirname, "..", "..", "frontend", "styles"),
    { recursive: true },
    (event, filename) => {
      if (filename && filename.endsWith('.css')) {
        console.log(`📝 CSS changed: ${filename}`);
        buildCSS();
      }
    }
  );

  // Initial build
  buildCSS();

  // Handle process exit
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping CSS watcher...");
    srcWatcher.close();
    stylesWatcher.close();
    process.exit(0);
  });
}

// Parse CLI args
const args = process.argv.slice(2);
const isWatchMode = args.includes("--watch") || args.includes("-w");

if (isWatchMode) {
  watchCSS();
} else {
  buildCSS();
}