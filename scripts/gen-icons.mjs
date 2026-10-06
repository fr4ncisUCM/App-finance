// Genera los iconos PNG de la app (PWA / iPhone) a partir de un SVG.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const svg = (padding) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#3355dd"/>
  <g transform="translate(${padding} ${padding}) scale(${(512 - 2 * padding) / 512})">
    <path fill="none" stroke="#ffffff" stroke-width="44" stroke-linecap="round" stroke-linejoin="round" d="M70 290h90l50-120 80 210 55-150 30 60h67"/>
  </g>
</svg>`;

mkdirSync("public/icons", { recursive: true });
const out = [
  ["public/icons/icon-192.png", 192, 40],
  ["public/icons/icon-512.png", 512, 40],
  ["public/icons/icon-maskable-512.png", 512, 100],
  ["public/apple-touch-icon.png", 180, 40],
];
for (const [file, size, padding] of out) {
  await sharp(Buffer.from(svg(padding))).resize(size, size).png().toFile(file);
  console.log("✓", file);
}
