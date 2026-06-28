import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const checks = [
  {
    path: "app/api/admin/reports/route.ts",
    patterns: ["export async function PATCH", "requireAdminWrite(request)"],
  },
  {
    path: "app/api/admin/addresses/route.ts",
    patterns: ["export async function PATCH", "requireAdminWrite(request)"],
  },
  {
    path: "app/api/admin/logout/route.ts",
    patterns: ["export async function POST", "requireAdminCsrf(request)"],
  },
  {
    path: "app/admin/(protected)/page.tsx",
    patterns: [
      "getAdminAuthHeaders()",
      'fetch("/api/admin/reports"',
      'fetch("/api/admin/addresses"',
    ],
  },
  {
    path: "app/admin/(protected)/AdminLogoutButton.tsx",
    patterns: ["getAdminAuthHeaders()", 'fetch("/api/admin/logout"'],
  },
  {
    path: "lib/adminClient.ts",
    patterns: ['"X-CSRF-Token"', "Record<string, string>"],
  },
  {
    path: "lib/adminSession.ts",
    patterns: ["createAdminCsrfToken", "verifyAdminCsrfToken"],
  },
];

const failures = [];

for (const check of checks) {
  const content = read(check.path);

  for (const pattern of check.patterns) {
    if (!content.includes(pattern)) {
      failures.push(`${check.path} is missing: ${pattern}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Admin CSRF regression check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Admin CSRF regression check passed.");
