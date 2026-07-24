"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  GOALS,
  SCOPE_EXCLUSIONS,
  SECTION_CATALOG,
  type GoalId,
  type ScopeResult,
  type SectionId,
} from "@/lib/scope-brief";

type Assets = {
  copy: boolean;
  logo: boolean;
  colors: boolean;
  images: boolean;
};

const initialSections: SectionId[] = ["hero", "offer", "faq", "final-cta"];
const initialAssets: Assets = {
  copy: true,
  logo: false,
  colors: true,
  images: false,
};

const SERVICE_URL =
  "https://www.freelancer.com/service/website_testing/i-will-build-a-responsive-landing-page";

const goalHeadlines: Record<GoalId, string> = {
  enquiries: "Give the right people one clear next step.",
  bookings: "Make the next available date easy to find.",
  sales: "Give one offer the space to stand out.",
  signups: "Turn interest into one focused action.",
  awareness: "Tell the useful part of the story first.",
};

function formatBriefForClipboard({
  projectName,
  audience,
  goal,
  ctaLabel,
  ctaUrl,
  assets,
  result,
}: {
  projectName: string;
  audience: string;
  goal: GoalId;
  ctaLabel: string;
  ctaUrl: string;
  assets: Assets;
  result: ScopeResult;
}) {
  const goalLabel = GOALS.find((item) => item.id === goal)?.label ?? goal;
  const suppliedAssets = Object.entries(assets)
    .filter(([, supplied]) => supplied)
    .map(([asset]) => asset)
    .join(", ");
  const lines = [
    "porQpine landing-page brief",
    "",
    `Project: ${projectName}`,
    `Audience: ${audience}`,
    `Goal: ${goalLabel}`,
    `CTA: ${ctaLabel || "Not supplied"}${ctaUrl ? ` — ${ctaUrl}` : ""}`,
    `Supplied assets: ${suppliedAssets || "None confirmed"}`,
    "",
    `Scope result: ${result.readiness.status.replaceAll("-", " ")}`,
    `Offer: ${result.summary.offer}`,
    `Price: $${result.summary.priceUsd}`,
    `Delivery: ${result.summary.delivery}`,
    `Revision: ${result.summary.revision}`,
    "",
    "Page architecture:",
    ...result.architecture.map(
      (section) => `${section.order}. ${section.label}: ${section.purpose}`,
    ),
  ];

  if (result.missingAssets.length) {
    lines.push(
      "",
      "Still to supply:",
      ...result.missingAssets.map(
        (item) => `- ${item.asset}${item.required ? " (required)" : " (optional)"}`,
      ),
    );
  }

  lines.push("", `Service: ${SERVICE_URL}`);
  return lines.join("\n");
}

export function LandingLab() {
  const [projectName, setProjectName] = useState("Juniper Ceramics");
  const [audience, setAudience] = useState("Curious beginners looking for a relaxed creative workshop");
  const [goal, setGoal] = useState<GoalId>("bookings");
  const [sections, setSections] = useState<SectionId[]>(initialSections);
  const [ctaLabel, setCtaLabel] = useState("View workshop dates");
  const [ctaUrl, setCtaUrl] = useState("https://example.com/workshops");
  const [assets, setAssets] = useState<Assets>(initialAssets);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [result, setResult] = useState<ScopeResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [requestState, setRequestState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const resultRef = useRef<HTMLDivElement>(null);

  const selectedCatalog = useMemo(
    () => sections.map((id) => SECTION_CATALOG.find((item) => item.id === id)!).filter(Boolean),
    [sections],
  );

  useEffect(() => {
    if (!result || requestState !== "success") return;
    resultRef.current?.focus({ preventScroll: true });
    resultRef.current?.scrollIntoView({ block: "nearest" });
  }, [requestState, result]);

  function toggleSection(id: SectionId) {
    setResult(null);
    setSections((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 4) return current;
      return [...current, id];
    });
  }

  function toggleAsset(id: keyof Assets) {
    setResult(null);
    setAssets((current) => ({ ...current, [id]: !current[id] }));
  }

  async function submitBrief(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestState("loading");
    setFieldErrors({});
    setCopyState("idle");

    try {
      const response = await fetch("/api/brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectName,
          audience,
          goal,
          sections,
          ctaLabel,
          ctaUrl,
          assets,
        }),
      });
      const payload = (await response.json()) as
        | ScopeResult
        | { error?: string; fieldErrors?: Record<string, string> };

      if (!response.ok) {
        setResult(null);
        setFieldErrors("fieldErrors" in payload ? (payload.fieldErrors ?? {}) : {});
        setRequestState("error");
        return;
      }

      setResult(payload as ScopeResult);
      setRequestState("success");
    } catch {
      setResult(null);
      setFieldErrors({ brief: "The scope check could not run. Please try again." });
      setRequestState("error");
    }
  }

  async function copyBrief() {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(
        formatBriefForClipboard({
          projectName,
          audience,
          goal,
          ctaLabel,
          ctaUrl,
          assets,
          result,
        }),
      );
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  const previewHref =
    ctaUrl.startsWith("http://") || ctaUrl.startsWith("https://") ? ctaUrl : "#preview-frame";

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="site-header" id="top">
        <a className="wordmark" href="#top" aria-label="porQpine, back to top">
          por<span>Q</span>pine
        </a>
        <nav aria-label="Primary navigation">
          <a href="#scope">Scope</a>
          <a href="#lab">Brief lab</a>
          <a className="nav-cta" href={SERVICE_URL} target="_blank" rel="noreferrer">
            Order for $10
          </a>
        </nav>
      </header>

      <main id="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              One page. One action. Zero scope fog.
            </p>
            <h1 id="hero-title">
              A sharp landing page,
              <span>without the surprise scope.</span>
            </h1>
            <p className="hero-lede">
              Supply the copy, logo, colors, and images. Get one polished static page that feels
              considered on desktop and mobile.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#lab">
                Shape your page brief <span aria-hidden="true">↘</span>
              </a>
              <a className="text-link" href={SERVICE_URL} target="_blank" rel="noreferrer">
                Open the $10 Freelancer offer
              </a>
            </div>
            <ul className="hero-notes" aria-label="Core deliverables">
              <li>Editable files</li>
              <li>Responsive styling</li>
              <li>One small revision</li>
            </ul>
          </div>

          <div className="hero-specimen" aria-label="Landing page scope specimen">
            <div className="burst" aria-hidden="true">
              <span>$10</span>
            </div>
            <div className="specimen-window">
              <div className="window-bar">
                <span />
                <span />
                <span />
                <b>STATIC / RESPONSIVE</b>
              </div>
              <div className="specimen-body">
                <p>LANDING PAGE / 01</p>
                <h2>Give one good offer room to breathe.</h2>
                <div className="specimen-lines" aria-hidden="true">
                  <span />
                  <span />
                </div>
                <span className="sample-button">ONE CTA LINK</span>
              </div>
            </div>
            <p className="specimen-caption">
              <span>↓</span> Designed around your supplied material, not made-up claims.
            </p>
          </div>
        </section>

        <section className="scope-rail" aria-label="Offer at a glance">
          <div><b>01</b><span>Static page</span></div>
          <div><b>≤ 04</b><span>Sections</span></div>
          <div><b>01</b><span>CTA link</span></div>
          <div><b>$10</b><span>Defined scope</span></div>
        </section>

        <section className="scope-section" id="scope" aria-labelledby="scope-title">
          <div className="section-heading">
            <p className="kicker">The tiny contract</p>
            <h2 id="scope-title">Small on purpose. Clear by design.</h2>
            <p>
              The $10 offer is a focused front-end build, not a miniature software project hiding
              inside a landing-page brief.
            </p>
          </div>

          <div className="scope-grid">
            <article className="scope-card included-card">
              <p className="card-index">IN / 10</p>
              <h3>What the build includes</h3>
              <ul className="check-list">
                <li>One static responsive landing page</li>
                <li>Up to four supplied-content sections</li>
                <li>Desktop and mobile styling</li>
                <li>One CTA destination link</li>
                <li>Editable HTML, CSS, and JavaScript</li>
                <li>One small revision</li>
              </ul>
            </article>

            <article className="scope-card excluded-card" id="boundaries">
              <p className="card-index">OUT / CLEAR</p>
              <h3>What stays outside</h3>
              <ul className="plain-list">
                {SCOPE_EXCLUSIONS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="lab-section" id="lab" aria-labelledby="lab-title">
          <div className="lab-heading">
            <div>
              <p className="kicker">Interactive brief builder</p>
              <h2 id="lab-title">Turn the ask into a page map.</h2>
            </div>
            <p>
              Make a few choices, watch a sample-safe layout respond, then run a deterministic
              scope check. Nothing is saved.
            </p>
          </div>

          <div className="lab-shell">
            <form className="brief-panel" onSubmit={submitBrief} noValidate>
              <div className="panel-label">
                <span>BRIEF INPUT</span>
                <span>01—05</span>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Project or brand name</span>
                  <input
                    name="projectName"
                    value={projectName}
                    maxLength={60}
                    onChange={(event) => {
                      setProjectName(event.target.value);
                      setResult(null);
                    }}
                    aria-invalid={Boolean(fieldErrors.projectName)}
                    aria-describedby={fieldErrors.projectName ? "projectName-error" : undefined}
                  />
                  {fieldErrors.projectName && (
                    <small className="field-error" id="projectName-error">
                      {fieldErrors.projectName}
                    </small>
                  )}
                </label>

                <label className="field">
                  <span>Primary goal</span>
                  <select
                    name="goal"
                    value={goal}
                    onChange={(event) => {
                      setGoal(event.target.value as GoalId);
                      setResult(null);
                    }}
                  >
                    {GOALS.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Who should this page speak to?</span>
                <textarea
                  name="audience"
                  rows={3}
                  maxLength={120}
                  value={audience}
                  onChange={(event) => {
                    setAudience(event.target.value);
                    setResult(null);
                  }}
                  aria-invalid={Boolean(fieldErrors.audience)}
                  aria-describedby={fieldErrors.audience ? "audience-error" : "audience-help"}
                />
                <small id="audience-help">One plain-language sentence is enough.</small>
                {fieldErrors.audience && (
                  <small className="field-error" id="audience-error">
                    {fieldErrors.audience}
                  </small>
                )}
              </label>

              <fieldset className="choice-fieldset">
                <legend>
                  Pick up to four sections <span>{sections.length}/4 selected</span>
                </legend>
                <p className="field-hint" id="sections-help">
                  Selection order becomes the proposed page order.
                </p>
                <div className="choice-grid" aria-describedby="sections-help">
                  {SECTION_CATALOG.map((section) => {
                    const selected = sections.includes(section.id);
                    const disabled = !selected && sections.length >= 4;
                    return (
                      <button
                        type="button"
                        className={selected ? "choice selected" : "choice"}
                        aria-pressed={selected}
                        disabled={disabled}
                        onClick={() => toggleSection(section.id)}
                        key={section.id}
                      >
                        <span>{selected ? "●" : "○"}</span>
                        {section.label}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.sections && <small className="field-error">{fieldErrors.sections}</small>}
              </fieldset>

              <div className="field-grid">
                <label className="field">
                  <span>CTA label</span>
                  <input
                    name="ctaLabel"
                    value={ctaLabel}
                    maxLength={42}
                    onChange={(event) => {
                      setCtaLabel(event.target.value);
                      setResult(null);
                    }}
                    aria-invalid={Boolean(fieldErrors.ctaLabel)}
                  />
                  {fieldErrors.ctaLabel && <small className="field-error">{fieldErrors.ctaLabel}</small>}
                </label>
                <label className="field">
                  <span>CTA destination</span>
                  <input
                    name="ctaUrl"
                    type="url"
                    inputMode="url"
                    value={ctaUrl}
                    maxLength={300}
                    onChange={(event) => {
                      setCtaUrl(event.target.value);
                      setResult(null);
                    }}
                    aria-invalid={Boolean(fieldErrors.ctaUrl)}
                  />
                  {fieldErrors.ctaUrl && <small className="field-error">{fieldErrors.ctaUrl}</small>}
                </label>
              </div>

              <fieldset className="choice-fieldset asset-fieldset">
                <legend>What is already supplied?</legend>
                <div className="asset-grid">
                  {(Object.keys(assets) as Array<keyof Assets>).map((key) => (
                    <label className="asset-toggle" key={key}>
                      <input
                        type="checkbox"
                        checked={assets[key]}
                        onChange={() => toggleAsset(key)}
                      />
                      <span aria-hidden="true" />
                      {key === "copy" ? "Approved copy" : key[0].toUpperCase() + key.slice(1)}
                    </label>
                  ))}
                </div>
              </fieldset>

              {fieldErrors.brief && <p className="form-error">{fieldErrors.brief}</p>}
              <button className="button button-submit" type="submit" disabled={requestState === "loading"}>
                {requestState === "loading" ? "Checking the scope…" : "Generate scoped architecture"}
                <span aria-hidden="true">→</span>
              </button>
              <p className="privacy-note">
                This endpoint validates the brief and returns a plan. It does not persist inputs or
                call external services.
              </p>
            </form>

            <div className="preview-panel">
              <div className="preview-toolbar">
                <div>
                  <span>LIVE PREVIEW</span>
                  <small>Sample content only</small>
                </div>
                <div className="mode-switch" role="group" aria-label="Preview width">
                  <button
                    type="button"
                    aria-pressed={previewMode === "desktop"}
                    onClick={() => setPreviewMode("desktop")}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    aria-pressed={previewMode === "mobile"}
                    onClick={() => setPreviewMode("mobile")}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              <div className="preview-stage" id="preview-frame">
                <div className={`preview-frame ${previewMode}`}>
                  <div className="mini-nav">
                    <b>{projectName || "Your project"}</b>
                    <span>MENU</span>
                  </div>
                  <div className="preview-sections">
                    {selectedCatalog.length === 0 && (
                      <div className="preview-empty">Choose a section to start the page map.</div>
                    )}
                    {selectedCatalog.map((section) => {
                      if (section.id === "hero") {
                        return (
                          <section className="mini-hero" key={section.id}>
                            <small>PREVIEW SAMPLE</small>
                            <h3>{goalHeadlines[goal]}</h3>
                            <p>For {audience || "the audience you want to reach"}.</p>
                            <a
                              href={previewHref}
                              onClick={(event) => event.preventDefault()}
                              aria-label={`Preview CTA: ${ctaLabel || "Your CTA"}`}
                            >
                              {ctaLabel || "Your CTA"} →
                            </a>
                          </section>
                        );
                      }
                      if (section.id === "offer") {
                        return (
                          <section className="mini-offer" key={section.id}>
                            <small>THE OFFER</small>
                            <h3>One clear idea, explained simply.</h3>
                            <div>
                              <span>What it is</span>
                              <span>Who it helps</span>
                              <span>Why it matters</span>
                            </div>
                          </section>
                        );
                      }
                      if (section.id === "details") {
                        return (
                          <section className="mini-details" key={section.id}>
                            <small>USEFUL DETAILS</small>
                            <h3>Everything needed to make the next step feel easy.</h3>
                            <p>Supplied facts and constraints sit here—no invented promises.</p>
                          </section>
                        );
                      }
                      if (section.id === "faq") {
                        return (
                          <section className="mini-faq" key={section.id}>
                            <small>QUICK ANSWERS</small>
                            <p><b>Question from approved copy</b><span>＋</span></p>
                            <p><b>Another practical question</b><span>＋</span></p>
                          </section>
                        );
                      }
                      return (
                        <section className="mini-final" key={section.id}>
                          <small>ONE LAST STEP</small>
                          <h3>Ready when the visitor is.</h3>
                          <a
                            href={previewHref}
                            onClick={(event) => event.preventDefault()}
                            aria-label={`Preview CTA: ${ctaLabel || "Your CTA"}`}
                          >
                            {ctaLabel || "Your CTA"} →
                          </a>
                        </section>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="result-shell"
            aria-live="polite"
            aria-atomic="false"
            ref={resultRef}
            tabIndex={-1}
          >
            {requestState === "idle" && (
              <div className="result-empty">
                <span>OUTPUT</span>
                <p>The scoped architecture will appear here after the check.</p>
              </div>
            )}
            {requestState === "error" && (
              <div className="result-empty error-result" role="alert">
                <span>CHECK THE BRIEF</span>
                <p>Correct the highlighted fields, then run the scope check again.</p>
              </div>
            )}
            {result && requestState === "success" && (
              <>
                <div className="result-summary">
                  <div>
                    <p className="kicker">Deterministic scope result</p>
                    <h3>
                      {result.readiness.status === "ready-to-build"
                        ? "Ready to build."
                        : "A few inputs are still missing."}
                    </h3>
                  </div>
                  <div className={`status-pill ${result.readiness.status}`}>
                    {result.readiness.status.replaceAll("-", " ")}
                  </div>
                </div>

                <div className="architecture-list">
                  {result.architecture.map((section) => (
                    <article key={section.id}>
                      <span>{String(section.order).padStart(2, "0")}</span>
                      <div>
                        <h4>{section.label}</h4>
                        <p>{section.purpose}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="readiness-grid">
                  <div>
                    <h4>Readiness checks</h4>
                    <ul>
                      {result.readiness.checks.map((check) => (
                        <li key={check.id}>
                          <span className={`check-dot ${check.status}`} aria-hidden="true" />
                          {check.label}
                          <small>{check.status}</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>Still to supply</h4>
                    {result.missingAssets.length ? (
                      <ul>
                        {result.missingAssets.map((item) => (
                          <li key={item.asset}>
                            {item.asset}
                            <small>{item.required ? "required" : "optional"}</small>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="all-ready">All listed assets are supplied.</p>
                    )}
                  </div>
                </div>
                <div className="result-actions">
                  <button className="button button-secondary" type="button" onClick={copyBrief}>
                    {copyState === "copied"
                      ? "Brief copied"
                      : copyState === "error"
                        ? "Copy unavailable"
                        : "Copy scoped brief"}
                    <span aria-hidden="true">{copyState === "copied" ? "✓" : "⧉"}</span>
                  </button>
                  <a
                    className="button button-primary"
                    href={SERVICE_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Continue on Freelancer <span aria-hidden="true">→</span>
                  </a>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="handoff-section" aria-labelledby="handoff-title">
          <p className="kicker">The handoff</p>
          <h2 id="handoff-title">You bring the ingredients. The build gives them structure.</h2>
          <div className="handoff-grid">
            <div>
              <span>YOU SUPPLY</span>
              <p>Approved copy</p>
              <p>Logo + colors</p>
              <p>Optimized images</p>
              <p>One CTA link</p>
            </div>
            <div className="handoff-arrow" aria-hidden="true">→</div>
            <div>
              <span>YOU RECEIVE</span>
              <p>Responsive page</p>
              <p>Editable source</p>
              <p>Clear file structure</p>
              <p>One small revision</p>
            </div>
          </div>
          <div className="handoff-actions">
            <a className="button button-primary" href={SERVICE_URL} target="_blank" rel="noreferrer">
              Order the scoped build on Freelancer <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#boundaries">
              Review the exact boundary first
            </a>
          </div>
        </section>
      </main>

      <footer>
        <a className="wordmark footer-mark" href="#top">
          por<span>Q</span>pine
        </a>
        <p>Static-first. Scope-tight. Made to be edited.</p>
        <a href={SERVICE_URL} target="_blank" rel="noreferrer">
          Order for $10 →
        </a>
      </footer>
    </>
  );
}
