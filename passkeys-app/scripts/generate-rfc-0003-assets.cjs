/**
 * Regenerates RFC-0003 branded PNGs (fingerprint whorl, Light Clean palette).
 * Usage: node scripts/generate-rfc-0003-assets.cjs [outputDir]
 * Default outputDir: <cwd>/assets/images (run from `passkeys-app/`, or pass a path arg).
 */
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

const BG = "#F8FAFC";
const PRIMARY = "#2563EB";
const CX = 100;
const CY = 100;
const RADII = [6, 13, 20, 27, 34, 41, 48, 55, 62];

function drawFingerprintRings(ctx, sizePx) {
  const scale = sizePx / 200;
  const lw = Math.max(0.8, 2.2 * scale);
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.strokeStyle = PRIMARY;
  ctx.shadowColor = "rgba(37, 99, 235, 0.4)";
  ctx.shadowBlur = Math.min(6, 3.5 * scale);

  for (let i = 0; i < RADII.length; i++) {
    const r = RADII[i];
    const gapDeg = (i / 8) * 70;
    ctx.beginPath();
    if (gapDeg < 0.5) {
      ctx.arc(CX, CY, r, 0, 2 * Math.PI);
    } else {
      const g = (gapDeg * Math.PI) / 180;
      ctx.arc(CX, CY, r, Math.PI / 2 + g / 2, Math.PI / 2 - g / 2, false);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function renderToBuffer(size, { rounded } = { rounded: false }) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, size, size);

  if (rounded) {
    const r = size * 0.22;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(0, 0, size, size, r);
    } else {
      // Fallback: approximate squircle with arc corners
      const w = size;
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.quadraticCurveTo(w, 0, w, r);
      ctx.lineTo(w, w - r);
      ctx.quadraticCurveTo(w, w, w - r, w);
      ctx.lineTo(r, w);
      ctx.quadraticCurveTo(0, w, 0, w - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
    }
    ctx.closePath();
    ctx.clip();
  }

  ctx.save();
  const s = size / 200;
  ctx.translate((size - 200 * s) / 2, (size - 200 * s) / 2);
  ctx.scale(s, s);
  drawFingerprintRings(ctx, 200);
  ctx.restore();
  return canvas.toBuffer("image/png");
}

function main() {
  const out =
    process.argv[2] || path.join(process.cwd(), "assets", "images");
  if (!fs.existsSync(out)) {
    fs.mkdirSync(out, { recursive: true });
  }

  const targets = [
    { name: "icon.png", size: 1024, rounded: true },
    { name: "adaptive-icon.png", size: 1024, rounded: false },
    { name: "splash-icon.png", size: 200, rounded: false },
    { name: "favicon.png", size: 32, rounded: false },
  ];

  for (const t of targets) {
    const buf = renderToBuffer(t.size, { rounded: t.rounded });
    fs.writeFileSync(path.join(out, t.name), buf);
    console.log("wrote", t.name, t.size, t.rounded ? "rounded" : "square");
  }
}

main();
