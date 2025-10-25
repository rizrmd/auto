#!/usr/bin/env bun

/**
 * Frontend Build Script
 *
 * This script builds the React frontend using Vite
 */

import { watch } from "node:fs";
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, "..", "..");

/**
 * Build React frontend with Vite
 */
async function buildFrontend() {
  try {
    console.log("⚛️ Building React frontend with Vite...");

    // Build with Vite
    execSync(`bunx vite build`, {
      stdio: "inherit",
      cwd: PROJECT_ROOT
    });

    console.log("✅ React frontend built successfully");
  } catch (error) {
    console.error("❌ Error building React frontend:", error);
  }
}

/**
 * Watch mode for development
 */
function watchFrontend() {
  console.log("👀 Starting Vite dev server...");

  // Start Vite dev server
  const viteProcess = spawn("bunx", ["vite"], {
    stdio: "inherit",
    cwd: PROJECT_ROOT
  });

  // Handle process exit
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping Vite dev server...");
    viteProcess.kill("SIGTERM");
    process.exit(0);
  });

  return viteProcess;
}

// Parse CLI args
const args = process.argv.slice(2);
const isWatchMode = args.includes("--watch") || args.includes("-w");

if (isWatchMode) {
  watchFrontend();
} else {
  buildFrontend();
}