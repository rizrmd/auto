#!/usr/bin/env bun

/**
 * Development Server Script
 *
 * This script manages all development processes:
 * - Frontend React build watcher
 * - CSS build watcher
 * - Backend hot reload server
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ProcessInfo {
  name: string;
  process: ReturnType<typeof spawn>;
  color: (text: string) => string;
}

// ANSI color codes for console output
const colors = {
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text: string) => `\x1b[35m${text}\x1b[0m`,
};

/**
 * Log message with process name and color
 */
function log(processName: string, color: (text: string) => string, message: string) {
  console.log(`${color(`[${processName}]`)} ${message}`);
}

/**
 * Spawn a child process with proper error handling
 */
function spawnProcess(name: string, command: string, args: string[], color: (text: string) => string): ProcessInfo {
  log(name, color, `Starting...`);

  const process = spawn(command, args, {
    stdio: "pipe",
    cwd: join(__dirname, "..")
  });

  // Handle stdout
  process.stdout?.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach(line => {
      if (line.trim()) {
        log(name, color, line);
      }
    });
  });

  // Handle stderr
  process.stderr?.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach(line => {
      if (line.trim()) {
        log(name, color, line);
      }
    });
  });

  // Handle process exit
  process.on("close", (code) => {
    if (code !== 0) {
      log(name, color, `Process exited with code ${code}`);
    } else {
      log(name, color, "Process completed");
    }
  });

  // Handle process error
  process.on("error", (error) => {
    log(name, color, `Error: ${error.message}`);
  });

  return { name, process, color };
}

/**
 * Main development server function
 */
async function startDevServer() {
  console.log(colors.cyan("=" .repeat(60)));
  console.log(colors.cyan("AutoLeads Development Server"));
  console.log(colors.cyan("=" .repeat(60)));

  const processes: ProcessInfo[] = [];

  try {
    // Start all processes in parallel
    const frontendProcess = spawnProcess(
      "Frontend",
      "bun",
      ["run", "scripts/build/build-frontend.ts", "--watch"],
      colors.green
    );
    processes.push(frontendProcess);

    const backendProcess = spawnProcess(
      "Backend",
      "bun",
      ["--hot", "backend/index.tsx"],
      colors.yellow
    );
    processes.push(backendProcess);

    // Wait a moment for all processes to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(colors.green("\n✅ All development processes started!"));
    console.log(colors.magenta("\n📝 Development servers running:"));
    console.log(colors.green("  • Frontend: Vite dev server with HMR"));
    console.log(colors.yellow("  • Backend:  Hot reload API server"));
    console.log(colors.cyan("\n🌐 Your app should be available at:"));
    console.log(colors.green("  • Frontend: http://localhost:5173/"));
    console.log(colors.yellow("  • Backend:  http://localhost:3000/"));
    console.log(colors.red("\nPress Ctrl+C to stop all processes"));

  } catch (error) {
    console.error(colors.red("❌ Failed to start development server:"), error);
    cleanup(processes);
    process.exit(1);
  }

  // Handle graceful shutdown
  const cleanup = (processesToClean: ProcessInfo[]) => {
    console.log(colors.cyan("\n🛑 Shutting down development server..."));

    processesToClean.forEach(({ name, process, color }) => {
      log(name, color, "Stopping...");
      process.kill("SIGTERM");
    });

    // Force kill after 5 seconds if processes don't stop
    setTimeout(() => {
      processesToClean.forEach(({ name, process, color }) => {
        if (!process.killed) {
          log(name, color, "Force stopping...");
          process.kill("SIGKILL");
        }
      });
      process.exit(0);
    }, 5000);
  };

  // Handle process signals
  process.on("SIGINT", () => cleanup(processes));
  process.on("SIGTERM", () => cleanup(processes));

  // Handle unexpected errors
  process.on("uncaughtException", (error) => {
    console.error(colors.red("Uncaught Exception:"), error);
    cleanup(processes);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error(colors.red("Unhandled Rejection at:"), promise, "reason:", reason);
    cleanup(processes);
  });
}

// Start the development server
startDevServer().catch((error) => {
  console.error(colors.red("❌ Development server failed to start:"), error);
  process.exit(1);
});