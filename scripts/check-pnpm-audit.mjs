import process from "node:process";

const ignoredAdvisories = new Set(["GHSA-fc5q-39xc-vjpf"]);

let input = "";
for await (const chunk of process.stdin) {
  input += chunk;
}

let report;
try {
  report = JSON.parse(input);
} catch {
  console.error("pnpm audit did not return valid JSON.");
  process.exitCode = 1;
  process.exit();
}
const blocking = [];

for (const advisory of Object.values(report.advisories ?? {})) {
  if (advisory.severity !== "high" && advisory.severity !== "critical") continue;
  if (ignoredAdvisories.has(advisory.github_advisory_id)) continue;
  blocking.push(advisory);
}

for (const advisory of Object.values(report.advisories ?? {})) {
  if (ignoredAdvisories.has(advisory.github_advisory_id)) {
    console.warn(
      `Advisory ${advisory.github_advisory_id} ignored: no patched release is currently available (${advisory.module_name}).`,
    );
  }
}

for (const advisory of blocking) {
  console.error(
    `[${advisory.severity}] ${advisory.github_advisory_id}: ${advisory.title} (${advisory.module_name})`,
  );
}

process.exitCode = blocking.length > 0 ? 1 : 0;
