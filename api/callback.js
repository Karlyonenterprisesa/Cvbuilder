/* Decap CMS — troca o código do GitHub por token (GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET na Vercel) */
module.exports = async (req, res) => {
  const code = new URL(req.url, "https://x").searchParams.get("code");
  let status = "error", content = { message: "Falha na autenticação" };
  try {
    const r = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code })
    });
    const j = await r.json();
    if (j.access_token) { status = "success"; content = { token: j.access_token, provider: "github" }; }
    else content = { message: j.error_description || j.error || "Erro" };
  } catch (e) { content = { message: String(e) }; }
  const msg = "authorization:github:" + status + ":" + JSON.stringify(content);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end("<!doctype html><script>(function(){function r(e){window.opener.postMessage(" + JSON.stringify(msg).replace(/</g, "\\u003c") + ",e.origin)}window.addEventListener('message',r,false);window.opener.postMessage('authorizing:github','*')})()</script>");
};
