#!/usr/bin/env node
/* M099 build: src/theory/*.html + src/questions/*.js + src/oldbank.js -> dist/M099.html
   usage: node build.js [--only toe1,em-tr] [--out path]            */
const fs = require('fs'), path = require('path'), katex = require('katex');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i < 0 ? null : args[i + 1]; };
const ONLY = opt('--only') ? opt('--only').split(',') : null;
const OUT = opt('--out') || path.join(__dirname, 'dist', 'M099.html');
const R = p => fs.readFileSync(path.join(__dirname, p), 'utf8');
const errors = [];
const MAC = { '\\s': '_{\\text{#1}}' };

function tex(t, display, where) {
  try {
    t = t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    return katex.renderToString(t.trim(), { output: 'mathml', displayMode: display, throwOnError: true, strict: false, macros: MAC })
      .replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '').replace(/<semantics>([\s\S]*?)<\/semantics>/g, '$1');
  } catch (e) { errors.push(`LaTeX қатесі [${where}]: ${t.slice(0, 80)} :: ${e.message.slice(0, 120)}`); return `<code>${t}</code>`; }
}
/* theory: \[..\] display, \(..\) inline */
function mathHTML(s, where) {
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (m, t) => `<div class="fm">${tex(t, true, where)}</div>`);
  return s.replace(/\\\(([\s\S]+?)\\\)/g, (m, t) => tex(t, false, where));
}
/* questions: $..$ inline and old ⟦..⟧ markers */
function mathQ(s, where) {
  return String(s).replace(/⟦(.+?)⟧/g, (m, t) => tex(t, false, where)).replace(/\$([^$]+)\$/g, (m, t) => tex(t, false, where));
}

/* ---------- plots ---------- */
const fmt = v => { let r = Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 100) / 100; return String(r).replace('.', ',').replace('-', '−'); };
function plot(spec, where) {
  let o; try { o = JSON.parse(spec); } catch (e) { errors.push(`plot JSON қатесі [${where}]: ${e.message}`); return ''; }
  const W = o.w || 480, H = o.h || 270, L = 46, B = 40, T = 14, Rr = 16;
  const [x0, x1] = o.x, [y0, y1] = o.y;
  const X = x => L + (x - x0) / (x1 - x0) * (W - L - Rr), Y = y => H - B - (y - y0) / (y1 - y0) * (H - B - T);
  const nx = o.xticks || 5, ny = o.yticks || 4;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${(o.title || '').replace(/"/g, '')}">`;
  for (let i = 0; i <= nx; i++) { const v = x0 + (x1 - x0) * i / nx; s += `<line class="gr" x1="${X(v)}" y1="${T}" x2="${X(v)}" y2="${H - B}"/><text class="tk mid" x="${X(v)}" y="${H - B + 15}">${fmt(v)}</text>`; }
  for (let i = 0; i <= ny; i++) { const v = y0 + (y1 - y0) * i / ny; s += `<line class="gr" x1="${L}" y1="${Y(v)}" x2="${W - Rr}" y2="${Y(v)}"/><text class="tk end" x="${L - 6}" y="${Y(v) + 4}">${fmt(v)}</text>`; }
  s += `<path class="ax" d="M${L} ${T}V${H - B}H${W - Rr}"/>`;
  if (y0 < 0 && y1 > 0) s += `<line class="ax" x1="${L}" y1="${Y(0)}" x2="${W - Rr}" y2="${Y(0)}"/>`;
  if (x0 < 0 && x1 > 0) s += `<line class="ax" x1="${X(0)}" y1="${T}" x2="${X(0)}" y2="${H - B}"/>`;
  if (o.xl) s += `<text class="tk end" x="${W - Rr}" y="${H - 6}">${o.xl}</text>`;
  if (o.yl) s += `<text class="tk" x="${L + 6}" y="${T + 10}">${o.yl}</text>`;
  (o.vlines || []).forEach(v => { s += `<line class="ds" x1="${X(v.x)}" y1="${T}" x2="${X(v.x)}" y2="${H - B}"/>` + (v.label ? `<text class="sm mid" x="${X(v.x)}" y="${T + 10}">${v.label}</text>` : ''); });
  (o.hlines || []).forEach(v => { s += `<line class="ds" x1="${L}" y1="${Y(v.y)}" x2="${W - Rr}" y2="${Y(v.y)}"/>` + (v.label ? `<text class="sm end" x="${W - Rr - 2}" y="${Y(v.y) - 4}">${v.label}</text>` : ''); });
  (o.curves || []).forEach((c, k) => {
    let f; try { f = new Function('x', 'with(Math){return ' + c.f + '}'); } catch (e) { errors.push(`plot f қатесі [${where}]: ${c.f}`); return; }
    const a = c.from ?? x0, b = c.to ?? x1; let d = '', pen = false;
    for (let i = 0; i <= 240; i++) { const x = a + (b - a) * i / 240; let y = f(x); if (!isFinite(y) || y < y0 - (y1 - y0) * 0.02 || y > y1 + (y1 - y0) * 0.02) { pen = false; continue; } d += (pen ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(y).toFixed(1); pen = true; }
    s += `<path class="k${(c.color || k % 4 + 1)}${c.dash ? ' dsh' : ''}" d="${d}"/>`;
  });
  (o.marks || []).forEach(m => { s += `<circle class="nd" cx="${X(m.x)}" cy="${Y(m.y)}" r="3.5"/>` + (m.label ? `<text class="sm${m.left ? ' end' : ''}" x="${X(m.x) + (m.left ? -7 : 7)}" y="${Y(m.y) + (m.below ? 15 : -7)}">${m.label}</text>` : ''); });
  s += '</svg>';
  const lg = (o.curves || []).filter(c => c.name).map((c, k) => `<span><i class="lg${(c.color || (o.curves.indexOf(c)) % 4 + 1)}"></i>${c.name}</span>`).join('');
  return (o.title ? `<div class="pt">${o.title}</div>` : '') + s + (lg ? `<div class="lgd">${lg}</div>` : '');
}

/* ---------- theory ---------- */
const TFILES = ['toe1', 'toe2', 'toe3', 'toe4', 'toe5', 'toe6', 'toe7', 'em-tr', 'em-sm', 'em-am', 'em-dc'];
if (ONLY) ONLY.forEach(f => { if (!TFILES.includes(f)) TFILES.push(f); });
let theory = '', cheats = '';
const toc = [];
for (const f of TFILES) {
  if (ONLY && !ONLY.includes(f)) continue;
  const p = `src/theory/${f}.html`;
  if (!fs.existsSync(path.join(__dirname, p))) { console.warn('жоқ: ' + p); continue; }
  let h = R(p);
  h = h.replace(/<figure class="plot" data-spec='([\s\S]*?)'>/g, (m, spec) => `<figure class="plot">` + plot(spec, f));
  h = mathHTML(h, f);
  h = h.replace(/<table/g, '<div class="tw"><table').replace(/<\/table>/g, '</table></div>');
  h = h.replace(/<svg viewBox="0 0 (\d+) (\d+)"(?![^>]*style)/g, (m, w) => `${m} style="max-width:${Math.round(w * 1.3)}px"`);
  const secs = [...h.matchAll(/<section class="topic" id="([\w-]+)"[^>]*data-short="([^"]*)"/g)];
  if (!secs.length) errors.push(`${f}: <section class="topic" id=.. data-short=..> табылмады`);
  secs.forEach(m => toc.push({ id: m[1], short: m[2], file: f }));
  const open = (h.match(/<section\b/g) || []).length, close = (h.match(/<\/section>/g) || []).length;
  if (open !== close) errors.push(`${f}: <section> ашылуы ${open}, жабылуы ${close}`);
  for (const m of h.matchAll(/<section class="cheat">([\s\S]*?)<\/section>/g)) {
    const before = h.slice(0, m.index), ids = [...before.matchAll(/<section class="topic" id="([\w-]+)"[^>]*data-short="([^"]*)"/g)], last = ids[ids.length - 1];
    if (last) cheats += `<div class="cheatblk" data-for="${last[1]}"><h3><a href="#${last[1]}">${last[2]}</a></h3>${m[1].replace(/<h3>[\s\S]*?<\/h3>/, '')}</div>`;
  }
  theory += h + '\n';
}

/* ---------- questions ---------- */
const SPEC = [[1, 'A', 3], [1, 'B', 2], [2, 'A', 2], [2, 'B', 3], [3, 'A', 2], [3, 'B', 1], [3, 'C', 2], [4, 'A', 2], [4, 'C', 3], [5, 'B', 3], [5, 'C', 2], [6, 'B', 1], [6, 'C', 1], [7, 'B', 2], [7, 'C', 1]];
const EML = 'CAABABBACACBBABCCBBC';
const cellOK = (t, l) => SPEC.some(c => c[0] === t && c[1] === l);
function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const QS = []; // {s:'toe'|'em', t, l, f:family, q, o:[[html,c]], e, fig}
let fam = 0;
function addQ(s, t, l, q, o, e, fig, where, family) {
  const nc = o.filter(x => x[1]).length;
  if (s === 'toe' && (o.length !== 5 || nc !== 1)) errors.push(`${where}: ЭТН сұрағында 5 нұсқа/1 дұрыс болуы керек: ${q.slice(0, 60)}`);
  if (s === 'em' && (o.length < 5 || o.length > 8 || nc < 1 || nc > 4)) errors.push(`${where}: ЭМ сұрағында 5-8 нұсқа, 1-4 дұрыс: ${q.slice(0, 60)}`);
  if (new Set(o.map(x => String(x[0]))).size !== o.length) errors.push(`${where}: қайталанған жауап нұсқасы: ${q.slice(0, 60)}`);
  if (s === 'toe' && !cellOK(t, l)) errors.push(`${where}: спецификацияда жоқ ұяшық t=${t} l=${l}`);
  if (!e) errors.push(`${where}: түсіндірме жоқ: ${q.slice(0, 60)}`);
  QS.push({ s, t, l, f: family, q: mathQ(q, where), o: o.map(x => [mathQ(x[0], where), x[1] ? 1 : 0]), e: mathQ(e || '', where), fig: fig || '' });
}
if (!ONLY) {
  const old = require('./src/oldbank.js');
  const inst = (g, i) => { const f = rng(1000 + i * 7919); return g({ f, p: a => a[Math.floor(f() * a.length)] }); };
  old.TOE.forEach(it => { fam++; const seen = new Set(); for (let i = 0; i < 12 && seen.size < 4; i++) { const x = inst(it.g, i); if (seen.has(x.q)) continue; seen.add(x.q); addQ('toe', it.t, it.l, x.q, [[x.a, 1]].concat(x.d.map(d => [d, 0])), x.e, '', 'old-toe', fam); } });
  old.EM.forEach(it => { fam++; const seen = new Set(); for (let i = 0; i < 12 && seen.size < 4; i++) { const x = inst(it.g, i); if (seen.has(x.q)) continue; seen.add(x.q); addQ('em', it.t, EML[it.t - 1], x.q, x.o, x.e, '', 'old-em', fam); } });
}
const qdir = path.join(__dirname, 'src/questions');
for (const f of fs.readdirSync(qdir).filter(x => x.endsWith('.js')).sort()) {
  const base = f.replace('.js', '');
  if (ONLY && !ONLY.includes(base)) continue;
  let arr; try { arr = require(path.join(qdir, f)); } catch (e) { errors.push(`${f}: жүктелмеді: ${e.message}`); continue; }
  const s = f.startsWith('toe') ? 'toe' : 'em';
  arr.forEach((x, i) => { fam++; addQ(s, x.t, s === 'em' ? EML[x.t - 1] : x.l, x.q, x.o, x.e, x.fig, `${f}#${i + 1}`, fam); });
}

/* ---------- assemble ---------- */
let page = R('shell.html');
const put = (k, v) => { page = page.split(`<!--${k}-->`).join(v); };
put('THEORY', theory); put('CHEATS', cheats);
put('DATA', `<script>const QS=${JSON.stringify(QS).replace(/<\/script/g, '<\\/script')};const TOC=${JSON.stringify(toc)};const SPEC=${JSON.stringify(SPEC)};const EML="${EML}";</script>`);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, '<!doctype html><html lang="kk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>' + page + '</body></html>');
fs.writeFileSync(OUT.replace(/\.html$/, '.artifact.html'), page);
const cnt = {}; QS.forEach(q => { const k = q.s + q.t + (q.s === 'toe' ? q.l : ''); cnt[k] = (cnt[k] || 0) + 1; });
console.log(`OK ${OUT} ${(page.length / 1024).toFixed(0)} KB; тақырып: ${toc.length}; сұрақ: ${QS.length}`);
console.log(Object.entries(cnt).map(([k, v]) => k + ':' + v).join(' '));
if (errors.length) { console.error('\nҚАТЕЛЕР (' + errors.length + '):\n' + errors.join('\n')); process.exit(1); }
