import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

let workerPromise;

function getWorker() {
  workerPromise ??= import(
    new URL(`../dist/server/index.js?test=${process.pid}-${Date.now()}`, import.meta.url).href
  ).then((module) => module.default);
  return workerPromise;
}

async function appRequest(path = "/", init) {
  const worker = await getWorker();
  return worker.fetch(
    new Request(new URL(path, "http://localhost"), init),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

const validBrief = {
  projectName: "Juniper Ceramics",
  audience: "Curious beginners looking for a relaxed creative workshop",
  goal: "bookings",
  sections: ["hero", "offer", "faq", "final-cta"],
  ctaLabel: "View workshop dates",
  ctaUrl: "https://example.com/workshops",
  assets: {
    copy: true,
    logo: false,
    colors: true,
    images: false,
  },
};

test("server-renders the finished, accessible landing page", async () => {
  const response = await appRequest("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);

  const html = await response.text();
  assert.match(html, /<title>porQpine Landing Page Lab<\/title>/i);
  assert.match(html, /A sharp landing page/);
  assert.match(html, /Interactive brief builder/);
  assert.match(html, /Skip to main content/);
  assert.match(html, /aria-label="Preview width"/);
  assert.match(html, /One static responsive landing page/);
  assert.match(html, /One small revision/);
  assert.match(html, /Sample content only/);
  assert.doesNotMatch(html, /testimonial|award-winning|conversion rate|trusted by/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("removes disposable starter UI and metadata", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /LandingLab/);
  assert.match(layout, /porQpine Landing Page Lab/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  const previewEntries = await readdir(
    new URL("../app/_sites-preview", import.meta.url),
  ).catch((error) => {
    if (error?.code === "ENOENT") return [];
    throw error;
  });
  assert.deepEqual(previewEntries, []);
});

test("POST /api/brief returns a deterministic scoped architecture", async () => {
  const makeRequest = () =>
    appRequest("/api/brief", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validBrief),
    });

  const firstResponse = await makeRequest();
  const secondResponse = await makeRequest();
  assert.equal(firstResponse.status, 200);
  assert.equal(firstResponse.headers.get("cache-control"), "no-store");
  assert.equal(secondResponse.status, 200);

  const first = await firstResponse.json();
  const second = await secondResponse.json();
  assert.deepEqual(first, second);
  assert.equal(first.summary.priceUsd, 10);
  assert.equal(first.summary.revision, "One small revision");
  assert.equal(first.readiness.status, "ready-to-build");
  assert.deepEqual(
    first.architecture.map((section) => section.id),
    validBrief.sections,
  );
  assert.deepEqual(first.missingAssets, [
    { asset: "Logo file", required: false },
    { asset: "Page images", required: false },
  ]);
  assert.ok(first.exclusions.includes("Database or data storage"));
  assert.ok(first.exclusions.includes("Form submission processing"));
  assert.ok(first.exclusions.includes("Hosting, domain, or deployment"));
});

test("POST /api/brief rejects unsafe or out-of-scope inputs", async () => {
  const response = await appRequest("/api/brief", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...validBrief,
      sections: ["hero", "offer", "details", "faq", "final-cta"],
      ctaUrl: "javascript:alert(1)",
    }),
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "The brief needs a few corrections.");
  assert.match(body.fieldErrors.sections, /up to four sections/i);
  assert.match(body.fieldErrors.ctaUrl, /http, https/i);
});

test("POST /api/brief requires JSON", async () => {
  const response = await appRequest("/api/brief", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "not json",
  });
  assert.equal(response.status, 415);
  assert.deepEqual(await response.json(), {
    error: "Content-Type must be application/json.",
  });
});

test("POST /api/brief rejects oversized payloads", async () => {
  const response = await appRequest("/api/brief", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: `"${"x".repeat(12_001)}"`,
  });
  assert.equal(response.status, 413);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});
