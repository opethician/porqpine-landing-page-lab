# porQpine Landing Page Lab

A polished portfolio product for shaping one tightly scoped static landing page.
The interface pairs a live desktop/mobile sample preview with a deterministic
brief endpoint that turns approved inputs into a page architecture and readiness
check.

## The truthful $10 offer

Included:

- one static responsive landing page built from supplied copy, logo, colors, and images
- up to four sections
- desktop and mobile styling
- one CTA destination link
- editable HTML, CSS, and JavaScript
- one small revision

Explicitly excluded:

- backend functionality or databases
- authentication or user accounts
- APIs or third-party integrations
- payments or checkout
- form submission processing
- CMS or WordPress
- hosting, domain, or deployment
- copywriting
- paid assets

The example preview is clearly labeled sample content. The product contains no
fabricated clients, testimonials, awards, or performance metrics.

## Product behavior

- The brief builder updates a safe sample layout as project, goal, section, and
  CTA choices change.
- Desktop and mobile preview widths are keyboard- and touch-operable.
- A maximum of four sections is enforced in the interface and at the API.
- `POST /api/brief` validates the brief and returns ordered architecture,
  readiness checks, missing assets, delivery scope, and exclusions.
- The API is deterministic: the same normalized input returns the same JSON.
- No input is persisted and the endpoint calls no external services.

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

The local development command uses the bundled vinext and Cloudflare-compatible
worker structure. D1 and R2 are disabled in `.openai/hosting.json`.

## Validation

```bash
npm run build
npm test
npm run lint
npx tsc --noEmit
```

The tests verify the server-rendered product surface, removal of starter preview
artifacts, truthful scope content, deterministic API output, exclusion coverage,
input limits, and content-type enforcement.

## API contract

Request:

```http
POST /api/brief
Content-Type: application/json
```

```json
{
  "projectName": "Juniper Ceramics",
  "audience": "Curious beginners looking for a relaxed creative workshop",
  "goal": "bookings",
  "sections": ["hero", "offer", "faq", "final-cta"],
  "ctaLabel": "View workshop dates",
  "ctaUrl": "https://example.com/workshops",
  "assets": {
    "copy": true,
    "logo": false,
    "colors": true,
    "images": false
  }
}
```

Supported goals are `enquiries`, `bookings`, `sales`, `signups`, and
`awareness`. Supported sections are `hero`, `offer`, `details`, `faq`, and
`final-cta`; one to four unique values are accepted. CTA destinations may use
HTTP(S), `mailto:`, `tel:`, a same-site `/path`, or a `#fragment`.

Successful responses contain:

- `scopeKey` — stable normalized identifier, not a stored record ID
- `summary` — offer, price, delivery format, and revision allowance
- `architecture` — ordered sections and content needs
- `readiness` — required and optional checks
- `missingAssets` — required/optional asset gaps
- `exclusions` — the exact boundary of the offer

Invalid input returns HTTP `400` with field-specific errors. Unsupported content
types return `415`, and request bodies over 12 KB return `413`.

## Accessibility and responsive UX

- semantic landmarks, headings, fieldsets, labels, and live status regions
- skip link and visible focus treatment
- no color-only selection state
- reduced-motion support
- form controls sized for touch
- layouts for wide screens, tablets, and small phones

## Main files

- `app/LandingLab.tsx` — interactive product UI and live preview
- `app/globals.css` — responsive visual system
- `app/api/brief/route.ts` — stateless POST endpoint
- `lib/scope-brief.ts` — validation and deterministic architecture logic
- `tests/rendered-html.test.mjs` — rendered and API contract tests

The app retains the Sites-compatible vinext and Cloudflare Worker build shape.
Its `.openai/hosting.json` binds the source to a dedicated Sites project and
declares that no D1 database or R2 bucket is required.
