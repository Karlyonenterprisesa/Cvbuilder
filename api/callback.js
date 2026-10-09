/* Decap CMS — troca o código do GitHub por token (GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET na Vercel) */
module.exports = async (req, res) => {
  const code = new URL(req.url, "https://x").searchParams.get("code");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (!code) {
    res.statusCode = 400;
    return res.end("<!doctype html><meta charset=utf-8><body style='font-family:sans-serif;padding:24px'><h2>Callback do Decap CMS</h2><p>Esta página só funciona dentro do login: abra <a href='/admin'>/admin</a> e clique em «Login with GitHub». Aberta directamente, não recebe o código do GitHub.</p></body>");
  }
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    res.statusCode = 500;
    return res.end("<!doctype html><meta charset=utf-8><body style='font-family:sans-serif;padding:24px'><h2>Falta configurar a Vercel</h2><p>Defina GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET em Settings → Environment Variables e faça Redeploy.</p></body>");
  }
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
  res.end("<!doctype html><script>(function(){function r(e){window.opener.postMessage(" + JSON.stringify(msg).replace(/</g, "\\u003c") + ",e.origin)}window.addEventListener('message',r,false);window.opener.postMessage('authorizing:github','*')})()</script>");
};
