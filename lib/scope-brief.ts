export const SECTION_CATALOG = [
  {
    id: "hero",
    label: "Hero",
    purpose: "Lead with one clear promise and the primary CTA.",
    contentNeeds: ["Approved headline", "Supporting copy", "Primary visual, if supplied"],
  },
  {
    id: "offer",
    label: "Offer",
    purpose: "Explain what is available and who it is for.",
    contentNeeds: ["Offer summary", "Three concise details", "Supplied imagery, if used"],
  },
  {
    id: "details",
    label: "Details",
    purpose: "Answer the practical questions that help someone decide.",
    contentNeeds: ["Key facts", "Process or inclusions", "Relevant constraints"],
  },
  {
    id: "faq",
    label: "FAQ",
    purpose: "Resolve a small set of common objections using approved copy.",
    contentNeeds: ["Up to four questions", "Approved answers"],
  },
  {
    id: "final-cta",
    label: "Final CTA",
    purpose: "Repeat the single action at the end of the page.",
    contentNeeds: ["CTA label", "Destination link", "Short closing line"],
  },
] as const;

export const GOALS = [
  { id: "enquiries", label: "Get enquiries" },
  { id: "bookings", label: "Drive bookings" },
  { id: "sales", label: "Present an offer" },
  { id: "signups", label: "Grow sign-ups" },
  { id: "awareness", label: "Explain the brand" },
] as const;

export const SCOPE_EXCLUSIONS = [
  "Backend functionality",
  "Database or data storage",
  "Authentication or user accounts",
  "APIs or third-party integrations",
  "Payments or checkout",
  "Form submission processing",
  "CMS or WordPress",
  "Hosting, domain, or deployment",
  "Copywriting",
  "Paid stock, fonts, or other paid assets",
] as const;

export type SectionId = (typeof SECTION_CATALOG)[number]["id"];
export type GoalId = (typeof GOALS)[number]["id"];

export type BriefInput = {
  projectName: string;
  audience: string;
  goal: GoalId;
  sections: SectionId[];
  ctaLabel: string;
  ctaUrl: string;
  assets: {
    copy: boolean;
    logo: boolean;
    colors: boolean;
    images: boolean;
  };
};

export type ScopeResult = {
  scopeKey: string;
  summary: {
    offer: string;
    priceUsd: 10;
    delivery: string;
    revision: string;
  };
  architecture: Array<{
    order: number;
    id: SectionId;
    label: string;
    purpose: string;
    contentNeeds: readonly string[];
  }>;
  readiness: {
    status: "ready-to-build" | "needs-input";
    checks: Array<{
      id: string;
      label: string;
      status: "ready" | "missing" | "optional";
    }>;
  };
  missingAssets: Array<{
    asset: string;
    required: boolean;
  }>;
  exclusions: readonly string[];
};

type ValidationResult =
  | { ok: true; input: BriefInput }
  | { ok: false; fieldErrors: Record<string, string> };

const sectionIds = new Set<string>(SECTION_CATALOG.map((section) => section.id));
const goalIds = new Set<string>(GOALS.map((goal) => goal.id));

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isSafeCtaUrl(value: string) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("#") && value.length > 1) return true;

  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function validateBrief(payload: unknown): ValidationResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, fieldErrors: { brief: "Send a JSON object." } };
  }

  const source = payload as Record<string, unknown>;
  const projectName = cleanText(source.projectName, 60);
  const audience = cleanText(source.audience, 120);
  const goal = cleanText(source.goal, 24);
  const ctaLabel = cleanText(source.ctaLabel, 42);
  const ctaUrl = cleanText(source.ctaUrl, 300);
  const rawSections = Array.isArray(source.sections) ? source.sections : [];
  const sections = rawSections.filter(
    (value): value is SectionId => typeof value === "string" && sectionIds.has(value),
  );
  const assetsSource =
    source.assets && typeof source.assets === "object" && !Array.isArray(source.assets)
      ? (source.assets as Record<string, unknown>)
      : {};
  const fieldErrors: Record<string, string> = {};

  if (!projectName) fieldErrors.projectName = "Add a project or brand name.";
  if (!audience) fieldErrors.audience = "Describe the intended audience.";
  if (!goalIds.has(goal)) fieldErrors.goal = "Choose one supported page goal.";
  if (!Array.isArray(source.sections) || rawSections.length === 0) {
    fieldErrors.sections = "Choose at least one section.";
  } else if (rawSections.length > 4) {
    fieldErrors.sections = "The $10 scope supports up to four sections.";
  } else if (sections.length !== rawSections.length || new Set(sections).size !== sections.length) {
    fieldErrors.sections = "Use unique section IDs from the supported list.";
  }
  if (ctaLabel && !ctaUrl) fieldErrors.ctaUrl = "Add the destination for this CTA.";
  if (ctaUrl && !ctaLabel) fieldErrors.ctaLabel = "Add a label for this CTA.";
  if (!isSafeCtaUrl(ctaUrl)) {
    fieldErrors.ctaUrl = "Use an http, https, mailto, tel, /path, or #anchor link.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    input: {
      projectName,
      audience,
      goal: goal as GoalId,
      sections,
      ctaLabel,
      ctaUrl,
      assets: {
        copy: assetsSource.copy === true,
        logo: assetsSource.logo === true,
        colors: assetsSource.colors === true,
        images: assetsSource.images === true,
      },
    },
  };
}

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "untitled"
  );
}

export function buildScope(input: BriefInput): ScopeResult {
  const checks: ScopeResult["readiness"]["checks"] = [
    { id: "copy", label: "Approved page copy supplied", status: input.assets.copy ? "ready" : "missing" },
    { id: "colors", label: "Brand colors supplied", status: input.assets.colors ? "ready" : "missing" },
    {
      id: "cta",
      label: "Single CTA label and link supplied",
      status: input.ctaLabel && input.ctaUrl ? "ready" : "missing",
    },
    { id: "logo", label: "Logo supplied", status: input.assets.logo ? "ready" : "optional" },
    { id: "images", label: "Images supplied", status: input.assets.images ? "ready" : "optional" },
  ];

  const missingAssets = [
    !input.assets.copy && { asset: "Approved page copy", required: true },
    !input.assets.colors && { asset: "Brand colors", required: true },
    !input.assets.logo && { asset: "Logo file", required: false },
    !input.assets.images && { asset: "Page images", required: false },
  ].filter((item): item is { asset: string; required: boolean } => Boolean(item));

  const architecture = input.sections.map((id, index) => {
    const section = SECTION_CATALOG.find((item) => item.id === id)!;
    return {
      order: index + 1,
      id,
      label: section.label,
      purpose: section.purpose,
      contentNeeds: section.contentNeeds,
    };
  });

  return {
    scopeKey: `${slug(input.projectName)}-${input.goal}-${input.sections.join(".")}`,
    summary: {
      offer: "One static responsive landing page with one CTA link",
      priceUsd: 10,
      delivery: "Editable HTML, CSS, and JavaScript",
      revision: "One small revision",
    },
    architecture,
    readiness: {
      status: checks.some((check) => check.status === "missing") ? "needs-input" : "ready-to-build",
      checks,
    },
    missingAssets,
    exclusions: SCOPE_EXCLUSIONS,
  };
}
