import { execFileSync } from "node:child_process"

function commitId() {
  const ciCommit = process.env.WORKERS_CI_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA
  if (ciCommit) return ciCommit.slice(0, 7)
  try {
    return execFileSync("git", ["rev-parse", "--short=7", "HEAD"], { encoding: "utf8" }).trim()
  } catch {
    return "unknown"
  }
}

// A source identifier rather than an incrementing counter: branch builds and
// pull requests can be identified without coordinating release numbers.
export const buildVersion = `${new Date().toISOString().slice(0, 10).replaceAll("-", ".")}.${commitId()}`
