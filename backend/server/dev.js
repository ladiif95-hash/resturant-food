const { spawn } = require("child_process");

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
let shuttingDown = false;

const processes = [
  ["api", ["run", "dev:api"]],
  ["client", ["run", "dev:client"]],
];

const children = processes.map(([name, args]) => {
  const child = isWindows ? spawn(`${npmCommand} ${args.join(" ")}`, {
    stdio: "inherit",
    shell: true,
  }) : spawn(npmCommand, args, {
    stdio: "inherit",
  });

  child.on("error", (error) => {
    if (shuttingDown) return;
    console.error(`${name} failed to start: ${error.message}`);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;

    if (code !== 0) {
      console.error(`${name} stopped with exit code ${code ?? signal}`);
      shutdown(code || 1);
    }
  });

  return child;
});

function shutdown(code = 0) {
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
