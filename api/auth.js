/* Decap CMS — início do login com GitHub (variável de ambiente GITHUB_CLIENT_ID na Vercel) */
module.exports = (req, res) => {
  const id = process.env.GITHUB_CLIENT_ID || "";
  const state = Math.random().toString(36).slice(2);
  res.statusCode = 302;
  res.setHeader("Location", "https://github.com/login/oauth/authorize?client_id=" + encodeURIComponent(id) + "&scope=repo,user&state=" + state);
  res.end();
};
