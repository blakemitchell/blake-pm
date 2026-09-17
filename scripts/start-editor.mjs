import { spawn } from "node:child_process";

const url = "http://127.0.0.1:4322/keystatic";

function openBrowser(targetUrl) {
  try {
    if (process.platform === "darwin") {
      spawn("open", [targetUrl], { stdio: "ignore", detached: true }).unref();
    } else if (process.platform === "win32") {
      spawn("cmd.exe", ["/c", "start", "", targetUrl], { stdio: "ignore", detached: true }).unref();
    } else {
      spawn("xdg-open", [targetUrl], { stdio: "ignore", detached: true }).unref();
    }
  } catch {
    // If the browser cannot be auto-opened, the terminal prints the URL
  }
}

const executable = process.platform === "win32" ? "npx.cmd" : "npx";
const editor = spawn(executable, ["astro", "dev", "--host", "127.0.0.1", "--port", "4322"], {
  stdio: "inherit",
  env: { ...process.env, KEYSTATIC_LOCAL: "true" },
});

setTimeout(() => openBrowser(url), 1200);

editor.on("exit", code => process.exit(code ?? 0));
