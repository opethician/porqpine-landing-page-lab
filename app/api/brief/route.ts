import { buildScope, validateBrief } from "@/lib/scope-brief";

const MAX_BODY_BYTES = 12_000;

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().split(";")[0].trim() !== "application/json") {
    return json({ error: "Content-Type must be application/json." }, 415);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json({ error: "Brief payload is too large." }, 413);
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return json({ error: "Brief payload is too large." }, 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "Request body must contain valid JSON." }, 400);
  }

  const validation = validateBrief(payload);
  if (!validation.ok) {
    return json(
      {
        error: "The brief needs a few corrections.",
        fieldErrors: validation.fieldErrors,
      },
      400,
    );
  }

  return json(buildScope(validation.input));
}
