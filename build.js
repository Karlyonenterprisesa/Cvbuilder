/* Gera vagas-data.json, vagas.html (lista), vaga/<slug>.html e entradas no sitemap a partir de content/vagas/*.json (Decap CMS). Corre no deploy (Vercel buildCommand). */
const fs = require("fs"), path = require("path");
const SITE = "https://adivisioncvbuilder.vercel.app";
const root = __dirname, dir = path.join(root, "content", "vagas");
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugify = s => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const MES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const fmt = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ""); return m ? (+m[3]) + " de " + MES[+m[2] - 1] + " de " + m[1] : ""; };
const img = p => p ? (/^https?:/.test(p) ? p : (p[0] === "/" ? p : "/" + p)) : "";
function md(t) {
  const out = []; let list = [];
  const flush = () => { if (list.length) { out.push("<ul>" + list.map(x => "<li>" + x + "</li>").join("") + "</ul>"); list = []; } };
  String(t || "").split(/\r?\n/).forEach(l => {
    const x = l.trim();
    if (!x) { flush(); return; }
    const e = esc(x).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    if (/^[-*] /.test(x)) list.push(e.replace(/^[-*] /, "")); else { flush(); out.push("<p>" + e + "</p>"); }
  });
  flush(); return out.join("");
}
const ICON = "/icon-80.png";
const pin = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.800 7 11 7 11z"/><circle cx="12" cy="10" r="2.500"/></svg>';
const clk = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const bag = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>';
const ico = v => `<img class="vg-ico" src="${esc(img(v.imagem) || ICON)}" alt="${esc(v.empresa || "")}" width="64" height="64" loading="lazy">`;
const daysLeft = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ""); if (!m) return ""; const n = Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(+today.slice(0,4), +today.slice(5,7) - 1, +today.slice(8,10))) / 864e5); return n <= 0 ? "termina hoje" : n === 1 ? "falta 1 dia" : "faltam " + n + " dias"; };
let vagas = [];
if (fs.existsSync(dir)) fs.readdirSync(dir).filter(f => f.endsWith(".json")).forEach(f => {
  try { const v = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); v.slug = slugify(v.slug || path.basename(f, ".json")); if (v.titulo) vagas.push(v); } catch (e) { console.warn("Ignorada:", f, e.message); }
});
const today = new Date().toISOString().slice(0, 10);
const activas = vagas.filter(v => !v.prazo || String(v.prazo).slice(0, 10) >= today)
  .sort((a, b) => String(a.prazo || "9999").localeCompare(String(b.prazo || "9999")));
fs.writeFileSync(path.join(root, "vagas-data.json"), JSON.stringify(activas.map(v => ({
  slug: v.slug, titulo: v.titulo, empresa: v.empresa || "", local: v.local || "", endereco: v.endereco || "", prazo: v.prazo ? String(v.prazo).slice(0, 10) : "", imagem: img(v.imagem)
}))));

const page = fs.readFileSync(path.join(root, "vagas.html"), "utf8");
const cards = activas.length ? activas.map(v => `<div class="card vg-card">${ico(v)}<div><h3><a href="/vaga/${v.slug}">${esc(v.titulo)}</a></h3><p class="vg-meta"><b>${esc(v.empresa)}</b></p><p class="vg-meta"><span class="vg-chip">${pin}${esc(v.endereco ? v.endereco + " — " + (v.local || "") : (v.local || "Moçambique"))}</span></p><p class="vg-meta"><span class="vg-chip">${clk}Prazo: ${esc(fmt(v.prazo) || "ver anúncio")}${daysLeft(v.prazo) ? " (" + daysLeft(v.prazo) + ")" : ""}</span>${v.contrato ? `<span class="vg-chip">${bag}${esc(v.contrato)}</span>` : ""}</p>${v.resumo ? `<p>${esc(v.resumo)}</p>` : ""}<a class="vg-btn" href="/vaga/${v.slug}">Ver vaga</a></div></div>`).join("") : `<div class="card"><p>Sem vagas abertas de momento. Volte em breve.</p></div>`;
fs.writeFileSync(path.join(root, "vagas.html"), page.replace(/<!--VAGAS-->[\s\S]*<!--\/VAGAS-->/, "<!--VAGAS-->" + cards + "<!--/VAGAS-->"));

const tpl = page.slice(0, page.indexOf("<main")), tail = page.slice(page.indexOf("</main>") + 7);
fs.mkdirSync(path.join(root, "vaga"), { recursive: true });
fs.readdirSync(path.join(root, "vaga")).filter(f => f.endsWith(".html")).forEach(f => fs.unlinkSync(path.join(root, "vaga", f)));
activas.forEach(v => {
  const url = SITE + "/vaga/" + v.slug, title = v.titulo + (v.empresa ? " — " + v.empresa : "") + " | Vagas de Emprego";
  const desc = (v.resumo || ("Vaga de emprego: " + v.titulo + (v.local ? " em " + v.local : "") + ". Prazo: " + (fmt(v.prazo) || "ver anúncio") + ".")).slice(0, 158);
  const ld = { "@context": "https://schema.org", "@type": "JobPosting", title: v.titulo, description: String(v.descricao || v.resumo || v.titulo).replace(/\s+/g, " "), datePosted: String(v.publicado || today).slice(0, 10), validThrough: v.prazo ? String(v.prazo).slice(0, 10) : undefined, employmentType: "FULL_TIME", hiringOrganization: { "@type": "Organization", name: v.empresa || "Ver anúncio" }, jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", streetAddress: v.endereco || undefined, addressLocality: v.local || "", addressCountry: "MZ" } }, url };
  let head = tpl.replace(/<title>[\s\S]*?<\/title>/, "<title>" + esc(title) + "</title>")
    .replace(/(<meta name="description" content=")[^"]*"/, "$1" + esc(desc) + '"')
    .replace(/(<link rel="canonical" href=")[^"]*"/, "$1" + url + '"')
    .replace(/(<meta property="og:title" content=")[^"]*"/, "$1" + esc(title) + '"').replace(/(<meta name="twitter:title" content=")[^"]*"/, "$1" + esc(title) + '"')
    .replace(/(<meta property="og:description" content=")[^"]*"/, "$1" + esc(desc) + '"').replace(/(<meta name="twitter:description" content=")[^"]*"/, "$1" + esc(desc) + '"')
    .replace(/(<meta property="og:url" content=")[^"]*"/, "$1" + url + '"')
    .replace("</head>", '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, "\\u003c") + "</script>\n</head>")
    .replace(' aria-current=page', "");
  const body = `<main id="conteudo"><div class="wrap"><div class="title"><div class="vg-head">${ico(v).replace('width="64" height="64"', 'width="72" height="72"')}<div><h1>${esc(v.titulo)}</h1><p>${esc(v.empresa)}</p></div></div></div><div class="card vg-body"><div class="vg-facts"><div>${pin} <b>Local:</b> ${esc(v.local || "Moçambique")}</div>${v.endereco ? `<div>${pin} <b>Localização exacta:</b> ${esc(v.endereco)}</div>` : ""}<div>${clk} <b>Prazo:</b> ${esc(fmt(v.prazo) || "ver anúncio")}${daysLeft(v.prazo) ? " (" + daysLeft(v.prazo) + ")" : ""}</div>${v.contrato ? `<div>${bag} <b>Contrato:</b> ${esc(v.contrato)}</div>` : ""}${v.publicado ? `<div><b>Publicado:</b> ${esc(fmt(v.publicado))}</div>` : ""}</div><h2>Descrição</h2>${md(v.descricao || v.resumo)}${v.como_candidatar ? "<h2>Como candidatar-se</h2>" + md(v.como_candidatar) : ""}${v.link_candidatura ? `<p><a class="vg-btn" href="${esc(v.link_candidatura)}" target="_blank" rel="noopener nofollow">Candidatar-se</a></p>` : ""}${v.fonte ? `<p class="vg-meta">Fonte: ${esc(v.fonte)}</p>` : ""}<p style="margin-top:14px"><a href="/">Prepare o seu currículo</a> · <a href="/vagas">← Todas as vagas</a></p><p class="vg-meta">Confirme sempre os detalhes no anúncio original. Nunca pague para se candidatar.</p></div></div></main>`;
  fs.writeFileSync(path.join(root, "vaga", v.slug + ".html"), head + body + tail);
});
const sm = path.join(root, "sitemap.xml");
if (fs.existsSync(sm)) fs.writeFileSync(sm, fs.readFileSync(sm, "utf8").replace(/<!--VAGAS-->[\s\S]*<!--\/VAGAS-->/, "<!--VAGAS-->" + activas.map(v => `<url><loc>${SITE}/vaga/${v.slug}</loc><lastmod>${today}</lastmod></url>`).join("") + "<!--/VAGAS-->"));
console.log("Vagas activas:", activas.length);
