/* Decap CMS — início do login com GitHub (variável de ambiente GITHUB_CLIENT_ID na Vercel) */
module.exports = (req, res) => {
  const id = process.env.GITHUB_CLIENT_ID || "";
  if (!id) {
    res.statusCode = 500; res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("<!doctype html><meta charset=utf-8><body style='font-family:sans-serif;padding:24px'><h2>Login não configurado</h2><p>A variável GITHUB_CLIENT_ID não está definida na Vercel. Veja <a href='/api/diagnostico'>/api/diagnostico</a>, defina as variáveis e faça Redeploy.</p></body>");
  }
  const state = Math.random().toString(36).slice(2);
  res.statusCode = 302;
  res.setHeader("Location", "https://github.com/login/oauth/authorize?client_id=" + encodeURIComponent(id) + "&scope=repo&state=" + state);
  res.end();
};
