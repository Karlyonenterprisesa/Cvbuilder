/* Diagnóstico do login do Decap CMS: abra /api/diagnostico. Não mostra segredos, só se estão definidos. */
module.exports = (req, res) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "SEU-DOMINIO";
  const ok = v => process.env[v] ? "✅ definido" : "❌ EM FALTA";
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  res.end("<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Diagnóstico do login</title>" +
    "<body style='font-family:system-ui,sans-serif;max-width:620px;margin:24px auto;padding:0 16px;line-height:1.6'>" +
    "<h2>Diagnóstico do login (Decap CMS)</h2><ul>" +
    "<li>GITHUB_CLIENT_ID: <b>" + ok("GITHUB_CLIENT_ID") + "</b></li>" +
    "<li>GITHUB_CLIENT_SECRET: <b>" + ok("GITHUB_CLIENT_SECRET") + "</b></li></ul>" +
    "<p>No GitHub (Settings → Developer settings → OAuth Apps), o campo <b>Authorization callback URL</b> tem de ser exactamente:</p>" +
    "<p><code style='background:#eef2f9;padding:6px 10px;border-radius:8px;display:inline-block'>https://" + String(host).replace(/[<>&\"]/g, "") + "/api/callback</code></p>" +
    "<p>Se alguma variável estiver em falta: Vercel → Settings → Environment Variables → adicionar → <b>Redeploy</b>.</p>" +
    "<p><a href='/admin'>Voltar ao /admin</a></p></body>");
};
