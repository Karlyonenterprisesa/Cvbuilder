/* Gera vagas-data.json, vagas.html (lista), vaga/<slug>.html e entradas no sitemap a partir de content/vagas/*.json (Decap CMS). Corre no deploy (Vercel buildCommand). */
const fs = require("fs"), path = require("path");
const SITE = "https://adivisioncvbuilder.vercel.app";
const root = __dirname, dir = path.join(root, "content", "vagas");
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugify = s => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const MES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const fmt = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ""); return m ? (+m[3]) + " de " + MES[+m[2] - 1] + " de " + m[1] : ""; };
const img = p => p ? (/^https?:/.test(p) ? p : (p[0] === "/" ? p : "/" + p)) : "";
function plain(v) { return String(v.descricao || v.resumo || v.responsabilidades || v.requisitos || "").replace(/^\s*[-*]\s+/gm, "").replace(/\s+/g, " ").trim(); }
function exc(v, n) { const t = plain(v); if (t.length <= n) return t; const c = t.slice(0, n); return c.slice(0, Math.max(c.lastIndexOf(" "), n - 30)) + "…"; }
function fonteLink(f) { f = String(f || "").trim(); if (!/^https?:\/\//i.test(f)) return esc(f); let h = f; try { h = new URL(f).hostname.replace(/^www\./, ""); } catch (e) {} return `<a href="${esc(f)}" target="_blank" rel="noopener nofollow">${esc(h)}</a>`; }
function inl(x) { return esc(x).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<i>$2</i>").replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener nofollow">$1</a>'); }
function md(t) {
  const out = []; let list = [], kind = "";
  const flush = () => { if (list.length) { out.push("<" + kind + ">" + list.map(x => "<li>" + x + "</li>").join("") + "</" + kind + ">"); list = []; kind = ""; } };
  String(t || "").split(/\r?\n/).forEach(l => {
    const x = l.trim();
    if (!x) { flush(); return; }
    let m;
    if ((m = /^[-*+] +(.*)$/.exec(x))) { if (kind !== "ul") flush(); kind = "ul"; list.push(inl(m[1])); }
    else if ((m = /^\d+[.)] +(.*)$/.exec(x))) { if (kind !== "ol") flush(); kind = "ol"; list.push(inl(m[1])); }
    else if ((m = /^#{1,6} +(.*)$/.exec(x))) { flush(); out.push("<h3>" + inl(m[1]) + "</h3>"); }
    else { flush(); out.push("<p>" + inl(x) + "</p>"); }
  });
  flush(); return out.join("");
}
const EMP = c => /parcial|meio/i.test(c || "") ? "PART_TIME" : /est[áa]gio/i.test(c || "") ? "INTERN" : /freelance|presta/i.test(c || "") ? "CONTRACTOR" : /tempor|prazo/i.test(c || "") ? "TEMPORARY" : /volunt/i.test(c || "") ? "VOLUNTEER" : "FULL_TIME";
function normaliza(v) {
  /* aceita os campos novos do Decap (config DecapBridge) e os antigos */
  if (v.imagem_empresa && !v.imagem) v.imagem = v.imagem_empresa;
  if (v.tipo_contrato && !v.contrato) v.contrato = v.tipo_contrato;
  if (v.data_limite && !v.prazo) v.prazo = String(v.data_limite).slice(0, 10);
  if (v.data_publicacao && !v.publicado) v.publicado = String(v.data_publicacao).slice(0, 10);
  const c = v.candidatura;
  if (c && typeof c === "object") { if (c.link && !v.link_candidatura) v.link_candidatura = c.link; if (c.email) v.email_candidatura = c.email; }
  return v;
}
const ICON = "/icon-80.png";
const pin = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.800 7 11 7 11z"/><circle cx="12" cy="10" r="2.500"/></svg>';
const clk = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const bag = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>';
const ico = v => `<img class="vg-ico" src="${esc(img(v.imagem) || ICON)}" alt="${esc(v.empresa || "")}" width="64" height="64" loading="lazy">`;
const daysLeft = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ""); if (!m) return ""; const n = Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(+today.slice(0,4), +today.slice(5,7) - 1, +today.slice(8,10))) / 864e5); return n <= 0 ? "termina hoje" : n === 1 ? "falta 1 dia" : "faltam " + n + " dias"; };
let vagas = [];
if (fs.existsSync(dir)) fs.readdirSync(dir).filter(f => f.endsWith(".json")).forEach(f => {
  try { const v = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); v.slug = slugify(v.slug || path.basename(f, ".json")); normaliza(v); if (v.titulo && !/fechad|encerrad/i.test(v.estado_vaga || "")) vagas.push(v); } catch (e) { console.warn("Ignorada:", f, e.message); }
});
const today = new Date().toISOString().slice(0, 10);
const activas = vagas.filter(v => !v.prazo || String(v.prazo).slice(0, 10) >= today)
  .sort((a, b) => String(a.prazo || "9999").localeCompare(String(b.prazo || "9999")));
fs.writeFileSync(path.join(root, "vagas-data.json"), JSON.stringify(activas.map(v => ({
  slug: v.slug, titulo: v.titulo, empresa: v.empresa || "", local: v.local || "", endereco: v.endereco || "", prazo: v.prazo ? String(v.prazo).slice(0, 10) : "", imagem: img(v.imagem)
}))));

const page = fs.readFileSync(path.join(root, "vagas.html"), "utf8");
const cards = activas.length ? activas.map(v => `<div class="card vg-card" data-q="${esc(plain(v))}">${ico(v)}<div><h3><a href="/vaga/${v.slug}">${esc(v.titulo)}</a></h3><p class="vg-meta"><b>${esc(v.empresa)}</b></p><p class="vg-meta"><span class="vg-chip">${pin}${esc(v.endereco ? v.endereco + " — " + (v.local || "") : (v.local || "Moçambique"))}</span></p><p class="vg-meta"><span class="vg-chip">${clk}Prazo: ${esc(fmt(v.prazo) || "ver anúncio")}${daysLeft(v.prazo) ? " (" + daysLeft(v.prazo) + ")" : ""}</span>${v.contrato ? `<span class="vg-chip">${bag}${esc(v.contrato)}</span>` : ""}</p>${exc(v, 170) ? `<p class="vg-sum">${esc(exc(v, 170))}</p>` : ""}<a class="vg-btn" href="/vaga/${v.slug}">Ver vaga</a></div></div>`).join("") : `<div class="card"><p>Sem vagas abertas de momento. Volte em breve.</p></div>`;
fs.writeFileSync(path.join(root, "vagas.html"), page.replace(/<!--VAGAS-->[\s\S]*<!--\/VAGAS-->/, "<!--VAGAS-->" + cards + "<!--/VAGAS-->"));

const tpl = page.slice(0, page.indexOf("<main")), tail = page.slice(page.indexOf("</main>") + 7);
fs.mkdirSync(path.join(root, "vaga"), { recursive: true });
fs.readdirSync(path.join(root, "vaga")).filter(f => f.endsWith(".html")).forEach(f => fs.unlinkSync(path.join(root, "vaga", f)));
activas.forEach(v => {
  const url = SITE + "/vaga/" + v.slug, title = v.titulo + (v.empresa ? " — " + v.empresa : "") + " | Vagas de Emprego";
  const desc = (exc(v, 158) || ("Vaga de emprego: " + v.titulo + (v.local ? " em " + v.local : "") + ". Prazo: " + (fmt(v.prazo) || "ver anúncio") + ".")).slice(0, 158);
  const ld = { "@context": "https://schema.org", "@type": "JobPosting", title: v.titulo, description: String(plain(v) || v.titulo), datePosted: String(v.publicado || today).slice(0, 10), validThrough: v.prazo ? String(v.prazo).slice(0, 10) : undefined, employmentType: EMP(v.contrato), hiringOrganization: { "@type": "Organization", name: v.empresa || "Ver anúncio" }, jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", streetAddress: v.endereco || undefined, addressLocality: v.local || "", addressCountry: "MZ" } }, url };
  let head = tpl.replace(/<title>[\s\S]*?<\/title>/, "<title>" + esc(title) + "</title>")
    .replace(/(<meta name="description" content=")[^"]*"/, "$1" + esc(desc) + '"')
    .replace(/(<link rel="canonical" href=")[^"]*"/, "$1" + url + '"')
    .replace(/(<meta property="og:title" content=")[^"]*"/, "$1" + esc(title) + '"').replace(/(<meta name="twitter:title" content=")[^"]*"/, "$1" + esc(title) + '"')
    .replace(/(<meta property="og:description" content=")[^"]*"/, "$1" + esc(desc) + '"').replace(/(<meta name="twitter:description" content=")[^"]*"/, "$1" + esc(desc) + '"')
    .replace(/(<meta property="og:url" content=")[^"]*"/, "$1" + url + '"')
    .replace("</head>", (v.palavras_chave ? '<meta name="keywords" content="' + esc(v.palavras_chave) + '">\n' : "") + '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, "\\u003c") + "</script>\n</head>")
    .replace(' aria-current=page', "");
  let dsc = String(v.descricao || v.resumo || ""), fnt = v.fonte || ""; const fm = dsc.match(/^[ \t]*Fonte[ \t]*:[ \t]*(\S+)[ \t]*$/im); if (fm) { if (!fnt) fnt = fm[1]; dsc = dsc.replace(fm[0], "").trim(); }
  const body = `<main id="conteudo"><div class="wrap"><div class="title"><div class="vg-head">${ico(v).replace('width="64" height="64"', 'width="72" height="72"')}<div><h1>${esc(v.titulo)}</h1><p>${esc(v.empresa)}</p>${v.categoria ? `<p><span class="vg-chip">${esc(v.categoria)}</span></p>` : ""}</div></div></div>
<div class="vg-grid">
<section class="card vg-c vg-c-local"><h2>${pin} Local</h2><p class="vg-big">${esc(v.local || "Moçambique")}</p>${v.endereco ? `<p class="vg-sub">${esc(v.endereco)}</p>` : ""}</section>
<section class="card vg-c vg-c-prazo"><h2>${clk} Prazo</h2><p class="vg-big">${esc(fmt(v.prazo) || "ver anúncio")}</p>${daysLeft(v.prazo) ? `<p class="vg-sub">${esc(daysLeft(v.prazo))}</p>` : ""}</section>
<section class="card vg-c vg-c-contrato"><h2>${bag} Tipo de contrato</h2><p class="vg-big">${esc(v.contrato || v.modalidade || "Ver anúncio")}</p>${v.contrato && v.modalidade ? `<p class="vg-sub">${esc(v.modalidade)}</p>` : ""}</section>
${v.publicado ? `<section class="card vg-c vg-c-pub"><h2>Publicado</h2><p class="vg-big">${esc(fmt(v.publicado))}</p></section>` : ""}
</div>
${dsc ? `<section class="card vg-c vg-c-desc"><h2>Descrição da vaga</h2>${md(dsc)}</section>` : ""}${v.responsabilidades ? `<section class="card vg-c vg-c-desc"><h2>Principais responsabilidades</h2>${md(v.responsabilidades)}</section>` : ""}${v.requisitos ? `<section class="card vg-c vg-c-req"><h2>Requisitos</h2>${md(v.requisitos)}</section>` : ""}
${v.como_candidatar || v.link_candidatura || v.email_candidatura ? `<section class="card vg-c vg-c-cand"><h2>Como candidatar-se</h2>${v.como_candidatar ? md(v.como_candidatar) : ""}${v.email_candidatura ? `<p>E-mail: <a href="mailto:${esc(v.email_candidatura)}">${esc(v.email_candidatura)}</a></p>` : ""}${v.link_candidatura ? `<p><a class="vg-btn" href="${esc(v.link_candidatura)}" target="_blank" rel="noopener nofollow">Candidatar-se</a></p>` : ""}</section>` : ""}
${fnt ? `<section class="card vg-c vg-c-fonte"><h2>Link / Fonte</h2><p>${fonteLink(fnt)}</p></section>` : ""}
${v.palavras_chave ? `<section class="card vg-c vg-c-tags"><h2>Palavras-chave</h2><p>${String(v.palavras_chave).split(",").map(t => t.trim()).filter(Boolean).map(t => `<span class="vg-chip">${esc(t)}</span>`).join(" ")}</p></section>` : ""}<section class="card vg-c vg-c-note"><p class="vg-sub"><a href="/">Prepare o seu currículo</a> · <a href="/vagas">← Todas as vagas</a></p><p class="vg-sub">Confirme sempre os detalhes no anúncio original. Nunca pague para se candidatar.</p></section></div></main>`;
  fs.writeFileSync(path.join(root, "vaga", v.slug + ".html"), head + body + tail);
});
const sm = path.join(root, "sitemap.xml");
if (fs.existsSync(sm)) fs.writeFileSync(sm, fs.readFileSync(sm, "utf8").replace(/<!--VAGAS-->[\s\S]*<!--\/VAGAS-->/, "<!--VAGAS-->" + activas.map(v => `<url><loc>${SITE}/vaga/${v.slug}</loc><lastmod>${today}</lastmod></url>`).join("") + "<!--/VAGAS-->"));
console.log("Vagas activas:", activas.length);
