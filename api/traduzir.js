/* Tradução PT → EN do conteúdo do CV (usado pelo botão EN). Corre no servidor da Vercel, por isso não depende de CORS. */
module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const fail = (code, msg) => { res.statusCode = code; res.end(JSON.stringify({ error: msg })); };
  if (req.method !== "POST") return fail(405, "POST");
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const origin = req.headers.origin;
  if (origin) { try { if (new URL(origin).host !== host) return fail(403, "origem"); } catch (e) { return fail(403, "origem"); } }
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = null; } }
  const texts = body && Array.isArray(body.texts) ? body.texts : null;
  if (!texts || !texts.length || texts.length > 40) return fail(400, "texts");
  let total = 0;
  for (const t of texts) { if (typeof t !== "string" || t.length > 1500) return fail(400, "texto"); total += t.length; }
  if (total > 12000) return fail(413, "tamanho");
  const one = async q => {
    try {
      const r = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=" + encodeURIComponent(q), { signal: AbortSignal.timeout(8000) });
      if (!r.ok) return null;
      const j = await r.json();
      const t = (j[0] || []).map(x => x[0]).join("");
      return t || null;
    } catch (e) { return null; }
  };
  const out = new Array(texts.length); let i = 0;
  const worker = async () => { while (i < texts.length) { const n = i++; out[n] = await one(texts[n]); } };
  await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
  res.end(JSON.stringify({ out }));
};
