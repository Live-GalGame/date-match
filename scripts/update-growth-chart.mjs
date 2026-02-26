#!/usr/bin/env node
import { writeFileSync } from "node:fs";

const DB_URL = process.env.DATABASE_URL;
const DB_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!DB_URL || !DB_TOKEN) {
  console.error("Missing DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

async function queryTurso(sql) {
  const httpUrl = DB_URL.replace("libsql://", "https://");
  const res = await fetch(`${httpUrl}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [{ type: "execute", stmt: { sql } }, { type: "close" }],
    }),
  });
  if (!res.ok) throw new Error(`Turso HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const first = json.results[0];
  if (first.type === "error") throw new Error(JSON.stringify(first.error));
  return first.response.result;
}

function fmt(n) {
  return n.toLocaleString("en-US");
}

function fmtDate(s) {
  const [, m, d] = s.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

function niceMax(v) {
  if (v <= 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const nice = norm <= 1.2 ? 1.5 : norm <= 2 ? 2 : norm <= 3 ? 3 : norm <= 5 ? 5 : norm <= 7.5 ? 8 : 10;
  return nice * mag;
}

function smoothPath(pts, yMin, yMax) {
  if (pts.length < 2) return "";
  if (pts.length === 2)
    return `M${pts[0].x},${pts[0].y}L${pts[1].x},${pts[1].y}`;

  const clamp = (v) => Math.min(Math.max(v, yMin), yMax);
  const t = 0.3;
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = clamp(p1.y + (p2.y - p0.y) * t);
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = clamp(p2.y - (p3.y - p1.y) * t);
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)},${c2x.toFixed(1)},${c2y.toFixed(1)},${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function generateChart(data) {
  const W = 800,
    H = 400;
  const pad = { top: 70, right: 50, bottom: 50, left: 65 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const maxVal = Math.max(...data.map((d) => d.cumulative));
  const yMax = niceMax(maxVal);
  const total = data[data.length - 1].cumulative;

  const points = data.map((d, i) => ({
    x: pad.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW),
    y: pad.top + plotH - (d.cumulative / yMax) * plotH,
    ...d,
  }));

  const line = smoothPath(points, pad.top, pad.top + plotH);
  const last = points[points.length - 1];
  const first = points[0];
  const area = `${line}L${last.x.toFixed(1)},${pad.top + plotH}L${first.x.toFixed(1)},${pad.top + plotH}Z`;

  const numTicks = 5;
  const tickStep = yMax / numTicks;
  const yTicks = Array.from({ length: numTicks + 1 }, (_, i) => Math.round(i * tickStep));

  // Decide x-axis label density
  const maxXLabels = 12;
  const xStep = data.length <= maxXLabels ? 1 : Math.ceil(data.length / maxXLabels);

  // Decide value label density (show first, last, and peaks)
  const showValueAt = new Set([0, data.length - 1]);
  // Also show the point with max daily growth
  let maxGrowthIdx = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i].newUsers > data[maxGrowthIdx].newUsers) maxGrowthIdx = i;
  }
  showValueAt.add(maxGrowthIdx);
  // If few points, show all
  if (data.length <= 8) for (let i = 0; i < data.length; i++) showValueAt.add(i);

  const font = `system-ui, -apple-system, 'Segoe UI', sans-serif`;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.22"/>
    <stop offset="100%" stop-color="#f43f5e" stop-opacity="0.01"/>
  </linearGradient>
  <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#e11d48"/>
    <stop offset="100%" stop-color="#fb7185"/>
  </linearGradient>
</defs>

<rect width="${W}" height="${H}" rx="14" fill="#fff"/>

<text x="${W / 2}" y="30" text-anchor="middle" font-family="${font}" font-size="17" font-weight="700" fill="#1f2937">Date-Match 用户增长</text>
<text x="${W / 2}" y="50" text-anchor="middle" font-family="${font}" font-size="12" fill="#9ca3af">累计 ${fmt(total)} 位用户 · 上线 ${data.length} 天</text>

`;

  // Grid
  for (const tick of yTicks) {
    const y = pad.top + plotH - (tick / yMax) * plotH;
    svg += `<line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${W - pad.right}" y2="${y.toFixed(1)}" stroke="${tick === 0 ? "#e5e7eb" : "#f3f4f6"}" stroke-width="1"/>\n`;
    svg += `<text x="${pad.left - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-family="${font}" font-size="10" fill="#b0b0b0">${fmt(tick)}</text>\n`;
  }

  // Area + Line
  svg += `<path d="${area}" fill="url(#ag)"/>\n`;
  svg += `<path d="${line}" fill="none" stroke="url(#lg)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>\n`;

  // Points + labels
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="#fff" stroke="#f43f5e" stroke-width="2"/>\n`;

    if (showValueAt.has(i)) {
      const labelY = p.y - 12;
      svg += `<text x="${p.x.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" font-family="${font}" font-size="11" font-weight="600" fill="#e11d48">${fmt(p.cumulative)}</text>\n`;
    }
  }

  // X-axis labels
  for (let i = 0; i < points.length; i++) {
    if (i % xStep !== 0 && i !== points.length - 1) continue;
    const p = points[i];
    svg += `<text x="${p.x.toFixed(1)}" y="${(pad.top + plotH + 20).toFixed(1)}" text-anchor="middle" font-family="${font}" font-size="10" fill="#9ca3af">${fmtDate(p.date)}</text>\n`;
  }

  // Timestamp
  const now = new Date().toISOString().split("T")[0];
  svg += `<text x="${W - pad.right}" y="${H - 8}" text-anchor="end" font-family="${font}" font-size="9" fill="#d1d5db">Updated ${now}</text>\n`;

  svg += `</svg>`;
  return svg;
}

// Main
const result = await queryTurso(
  `SELECT DATE(createdAt) as date, COUNT(*) as new_users, SUM(COUNT(*)) OVER (ORDER BY DATE(createdAt)) as cumulative FROM "User" GROUP BY DATE(createdAt) ORDER BY date`
);

const data = result.rows.map((row) => ({
  date: typeof row[0] === "object" ? row[0].value : String(row[0]),
  newUsers: parseInt(typeof row[1] === "object" ? row[1].value : row[1]),
  cumulative: parseInt(typeof row[2] === "object" ? row[2].value : row[2]),
}));

const svg = generateChart(data);
writeFileSync("public/growth-chart.svg", svg);
console.log(`Chart updated: ${data.length} days, ${fmt(data[data.length - 1].cumulative)} total users`);
