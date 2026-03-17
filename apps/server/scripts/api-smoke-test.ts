/**
 * API Smoke Test Script
 *
 * Tests all server API endpoints sequentially. Run with server, MongoDB, and Redis up.
 *
 * Env vars:
 *   BASE_URL      - API base URL (default: http://localhost:4000)
 *   TEST_EMAIL    - Optional; if set, use this email (try login first, register on failure)
 *   TEST_PASSWORD - Optional; if not set, uses "TestPass123!"
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4000";
const TEST_EMAIL = process.env.TEST_EMAIL ?? `test-${Date.now()}@smoke.local`;
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "TestPass123!";

type TestResult = { name: string; ok: boolean; status?: number; error?: string };

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return formatDate(new Date());
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

async function req(
  method: string,
  path: string,
  options: { body?: object; token?: string } = {},
): Promise<{ ok: boolean; status: number; data?: unknown }> {
  const url = `${BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data: unknown;
  try {
    data = await res.json().catch(() => ({}));
  } catch {
    data = {};
  }
  return { ok: res.ok, status: res.status, data };
}

async function main(): Promise<void> {
  console.log(`\nAPI Smoke Test – ${BASE_URL}\n`);

  let token: string | undefined;
  let challengeId: string | undefined;
  const results: TestResult[] = [];

  const run = async (
    name: string,
    fn: () => Promise<{ ok: boolean; status?: number; body?: unknown }>,
  ) => {
    try {
      const out = await fn();
      const ok = out.ok;
      const errMsg = ok ? undefined : (out.body as { message?: string })?.message ?? String(out.body ?? "Unknown error");
      results.push({ name, ok, status: out.status, error: errMsg });
      console.log(ok ? `  ✓ ${name}` : `  ✗ ${name} (${out.status})${errMsg ? ` – ${errMsg}` : ""}`);
      return out;
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      results.push({ name, ok: false, error: err });
      console.log(`  ✗ ${name} – ${err}`);
      return { ok: false };
    }
  };

  // 1. Health live
  await run("GET /health/live", async () => {
    const r = await req("GET", "/health/live");
    return { ok: r.ok, status: r.status };
  });

  // 2. Health ready
  await run("GET /health/ready", async () => {
    const r = await req("GET", "/health/ready");
    return { ok: r.ok, status: r.status };
  });

  // 3. Register
  await run("POST /auth/register", async () => {
    const r = await req("POST", "/auth/register", {
      body: { email: TEST_EMAIL, password: TEST_PASSWORD, name: "Smoke Test User" },
    });
    if (r.ok || r.status === 409) return { ok: true, status: r.status };
    return { ok: false, status: r.status, body: r.data };
  });

  // 4. Login
  await run("POST /auth/login", async () => {
    const r = await req("POST", "/auth/login", {
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    if (r.ok && r.data && typeof r.data === "object" && "token" in r.data) {
      token = (r.data as { token: string }).token;
      return { ok: true, status: r.status };
    }
    return { ok: false, status: r.status, body: r.data };
  });

  if (!token) {
    console.log("\nNo token – skipping authenticated tests.\n");
    printSummary(results);
    process.exit(1);
  }

  // 5. GET /me
  await run("GET /me", async () => {
    const r = await req("GET", "/me", { token });
    return { ok: r.ok, status: r.status };
  });

  // 6. GET /challenges
  await run("GET /challenges", async () => {
    const r = await req("GET", "/challenges");
    return { ok: r.ok, status: r.status };
  });

  const startDate = today();
  const endDate = formatDate(addDays(new Date(), 7));

  // 7. POST /challenges
  await run("POST /challenges", async () => {
    const r = await req("POST", "/challenges", {
      token,
      body: {
        title: "Smoke Test Challenge",
        description: "Created by api-smoke-test",
        metric: "steps",
        dailyTarget: 5000,
        startDate,
        endDate,
        visibility: "public",
      },
    });
    if (r.ok && r.data && typeof r.data === "object" && "challenge" in r.data) {
      const ch = (r.data as { challenge: { id?: string } }).challenge;
      challengeId = ch?.id;
    }
    return { ok: r.ok, status: r.status, body: r.data };
  });

  if (!challengeId) {
    console.log("\nNo challenge created – skipping challenge tests.\n");
    printSummary(results);
    process.exit(1);
  }

  // 8. GET /challenges/:id
  await run(`GET /challenges/${challengeId}`, async () => {
    const r = await req("GET", `/challenges/${challengeId}`);
    return { ok: r.ok, status: r.status };
  });

  // 9. PATCH /challenges/:id
  await run(`PATCH /challenges/${challengeId}`, async () => {
    const r = await req("PATCH", `/challenges/${challengeId}`, {
      token,
      body: { title: "Updated Title" },
    });
    return { ok: r.ok, status: r.status, body: r.data };
  });

  // 10. POST /challenges/:id/join
  await run(`POST /challenges/${challengeId}/join`, async () => {
    const r = await req("POST", `/challenges/${challengeId}/join`, { token });
    return { ok: r.ok || r.status === 409, status: r.status, body: r.data }; // 409 = Already joined
  });

  // 11. GET /my/challenges
  await run("GET /my/challenges", async () => {
    const r = await req("GET", "/my/challenges", { token });
    return { ok: r.ok, status: r.status };
  });

  // 12. POST /challenges/:id/logs
  await run(`POST /challenges/${challengeId}/logs`, async () => {
    const r = await req("POST", `/challenges/${challengeId}/logs`, {
      token,
      body: { amount: 6000, date: today() },
    });
    return { ok: r.ok, status: r.status, body: r.data };
  });

  // 13. GET /challenges/:id/logs/me
  await run(`GET /challenges/${challengeId}/logs/me`, async () => {
    const r = await req("GET", `/challenges/${challengeId}/logs/me`, { token });
    return { ok: r.ok, status: r.status };
  });

  // 14. GET /challenges/:id/leaderboard
  await run(`GET /challenges/${challengeId}/leaderboard`, async () => {
    const r = await req("GET", `/challenges/${challengeId}/leaderboard`);
    return { ok: r.ok, status: r.status };
  });

  // 15. DELETE /challenges/:id
  await run(`DELETE /challenges/${challengeId}`, async () => {
    const r = await req("DELETE", `/challenges/${challengeId}`, { token });
    return { ok: r.ok, status: r.status, body: r.data };
  });

  printSummary(results);
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

function printSummary(results: TestResult[]): void {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log("\n" + "─".repeat(50));
  console.log(`Passed: ${passed}, Failed: ${failed.length}`);
  if (failed.length > 0) {
    console.log("\nFailed endpoints:");
    failed.forEach((r) => console.log(`  - ${r.name}${r.error ? `: ${r.error}` : ""}`));
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
