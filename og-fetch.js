/* Descarrega, no deploy, a imagem de cada vaga (campo imagem / imagem_empresa quando é um link http/https)
   para img/vagas/og-<slug>.<ext>, para o Facebook/WhatsApp não depender de sites externos (hotlink bloqueado ou expirado).
   Falhas nunca param o deploy: se o download falhar, build.js usa o link original ou a imagem geral. */
const fs = require("fs"), path = require("path");
function imgSize(b) {
  try {
    if (b.length > 24 && b.slice(1, 4).toString() === "PNG") return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), ext: "png", type: "image/png" };
    if (b[0] === 0xFF && b[1] === 0xD8) {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xFF) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7), ext: "jpg", type: "image/jpeg" };
        i += 2 + b.readUInt16BE(i + 2);
      }
      return { w: 0, h: 0, ext: "jpg", type: "image/jpeg" };
    }
    if (b.slice(0, 3).toString() === "GIF") return { w: b.readUInt16LE(6), h: b.readUInt16LE(8), ext: "gif", type: "image/gif" };
    if (b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP") {
      const t = b.slice(12, 16).toString();
      if (t === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), ext: "webp", type: "image/webp" };
      if (t === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, ext: "webp", type: "image/webp" };
      if (t === "VP8L") { const x = b.readUInt32LE(21); return { w: (x & 0x3fff) + 1, h: ((x >> 14) & 0x3fff) + 1, ext: "webp", type: "image/webp" }; }
    }
  } catch (e) {}
  return null;
}
module.exports = { imgSize };
if (require.main === module) (async () => {
  const root = __dirname, dir = path.join(root, "content", "vagas"), out = path.join(root, "img", "vagas");
  const slugify = s => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!fs.existsSync(dir) || typeof fetch !== "function") return;
  fs.mkdirSync(out, { recursive: true });
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith(".json"))) {
    try {
      const v = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), slug = slugify(v.slug || path.basename(f, ".json"));
      const src = String(v.imagem || v.imagem_empresa || "").trim();
      if (!/^https?:\/\//i.test(src)) continue;
      const r = await fetch(src, { redirect: "follow", signal: AbortSignal.timeout(10000), headers: { "User-Agent": "Mozilla/5.0 (compatible; AdivisionBot/1.0)", "Accept": "image/*" } });
      if (!r.ok) { console.warn("og-fetch:", slug, "HTTP", r.status); continue; }
      const buf = Buffer.from(await r.arrayBuffer()), sz = imgSize(buf);
      if (!sz || buf.length > 5 * 1024 * 1024) { console.warn("og-fetch:", slug, "formato/tamanho não suportado"); continue; }
      fs.readdirSync(out).filter(x => x.startsWith("og-" + slug + ".")).forEach(x => fs.unlinkSync(path.join(out, x)));
      fs.writeFileSync(path.join(out, "og-" + slug + "." + sz.ext), buf);
      console.log("og-fetch:", slug, sz.w + "x" + sz.h);
    } catch (e) { console.warn("og-fetch: falhou", f, e.message); }
  }
})().catch(() => {});
