// Core logic for the poll API. Kept separate from the Netlify wrapper so it can be tested anywhere.
// Storage layout: one small JSON blob per voter at "<client-code>/<voter-id>".
// One blob per voter means two people voting at the same moment can never overwrite each other.

const CODE_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const VOTER_RE = /^[A-Za-z0-9-]{8,64}$/;
const KEY_RE = /^[a-z0-9_]{1,30}$/;
const MAX_VOTES = 2000;
const MAX_BODY_BYTES = 8000;
const MAX_VALUE_LEN = 60;
const MAX_KEYS = 20;
const MAX_LIST = 12;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function cleanValue(v) {
  if (typeof v !== "string") return null;
  const s = v.replace(/\s+/g, " ").trim();
  if (!s || s.length > MAX_VALUE_LEN) return null;
  return s;
}

export function cleanAnswers(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const keys = Object.keys(raw);
  if (keys.length === 0 || keys.length > MAX_KEYS) return null;
  const out = {};
  for (const k of keys) {
    if (!KEY_RE.test(k)) return null;
    const v = raw[k];
    if (Array.isArray(v)) {
      if (v.length === 0 || v.length > MAX_LIST) return null;
      const list = [];
      for (const item of v) {
        const c = cleanValue(item);
        if (c === null) return null;
        list.push(c);
      }
      out[k] = list;
    } else {
      const c = cleanValue(v);
      if (c === null) return null;
      out[k] = c;
    }
  }
  return out;
}

export async function handle(req, store, getEnv) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("c") || "").toLowerCase();
  if (!CODE_RE.test(code)) return json({ error: "bad_code" }, 400);
  const prefix = `${code}/`;

  if (req.method === "GET") {
    const { blobs } = await store.list({ prefix });
    const keys = blobs.slice(0, MAX_VOTES);
    const rows = await Promise.all(
      keys.map((b) => store.get(b.key, { type: "json" }).catch(() => null))
    );
    const votes = rows.filter((r) => r && r.answers).map((r) => r.answers);
    return json({ count: votes.length, votes });
  }

  if (req.method === "POST") {
    const declared = Number(req.headers.get("content-length") || 0);
    if (declared > MAX_BODY_BYTES) return json({ error: "too_large" }, 413);
    let body;
    try {
      const text = await req.text();
      if (text.length > MAX_BODY_BYTES) return json({ error: "too_large" }, 413);
      body = JSON.parse(text);
    } catch {
      return json({ error: "bad_json" }, 400);
    }
    if (!body || typeof body !== "object") return json({ error: "bad_json" }, 400);

    if (url.searchParams.get("action") === "reset") {
      const pin = getEnv("RESET_PIN");
      if (!pin) return json({ error: "reset_not_configured" }, 403);
      if (typeof body.pin !== "string" || body.pin !== pin) return json({ error: "wrong_pin" }, 401);
      const { blobs } = await store.list({ prefix });
      await Promise.all(blobs.map((b) => store.delete(b.key)));
      return json({ ok: true, deleted: blobs.length });
    }

    if (typeof body.voter !== "string" || !VOTER_RE.test(body.voter)) {
      return json({ error: "bad_voter" }, 400);
    }
    const answers = cleanAnswers(body.answers);
    if (!answers) return json({ error: "bad_answers" }, 400);

    // Same voter id overwrites, so a person can correct their answers without double counting.
    await store.setJSON(`${prefix}${body.voter}`, { answers, at: Date.now() });
    return json({ ok: true });
  }

  return json({ error: "method_not_allowed" }, 405);
}
