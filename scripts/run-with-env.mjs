import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");
const envPath = join(projectRoot, ".env");

function parseEnvFile(contents) {
  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((accumulator, line) => {
      const separatorIndex = line.indexOf("=");

      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      accumulator[key] = value;
      return accumulator;
    }, {});
}

const [binary, ...args] = process.argv.slice(2);

if (!binary) {
  console.error("Usage: node scripts/run-with-env.mjs <binary> [...args]");
  process.exit(1);
}

const localEnv = parseEnvFile(readFileSync(envPath, "utf8"));
const binaryName = process.platform === "win32" ? `${binary}.CMD` : binary;
const candidateDirectories = [
  process.cwd(),
  projectRoot,
  ...["packages", "apps"].flatMap((segment) => {
    const directory = join(projectRoot, segment);

    if (!existsSync(directory)) {
      return [];
    }

    return readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(directory, entry.name));
  })
];

const executable =
  candidateDirectories
    .map((directory) => join(directory, "node_modules", ".bin", binaryName))
    .find((candidate) => existsSync(candidate)) ?? join(projectRoot, "node_modules", ".bin", binaryName);
const command = process.platform === "win32" ? "cmd.exe" : executable;
const commandArgs = process.platform === "win32" ? ["/c", executable, ...args] : args;

const child = spawn(command, commandArgs, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    ...localEnv
  },
  stdio: "inherit",
  shell: false
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
