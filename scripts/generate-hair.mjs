import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
// Procedural demo assets: eight genuine viewpoints of an original SVG mannequin.
// Kept separate from the photographic hero. Replace the files with salon photography.
const colors = {
  black: "#303036",
  ash: "#7a807b",
  silver: "#c7cbd2",
  blonde: "#c9ac73",
  "dark-brown": "#68493b",
  beige: "#bca58b",
  red: "#9c343a",
  pink: "#c68c9f",
};
function render(color, angle) {
  const rad = (angle * Math.PI) / 4,
    sin = Math.sin(rad),
    cos = Math.cos(rad),
    front = cos > -0.1,
    faceX = 300 + sin * 44,
    faceWidth = cos > 0.5 ? 78 : cos > -0.1 ? 52 : 0;
  const strands = Array.from({ length: 105 }, (_, i) => {
    const t = i / 104;
    const x = 170 + t * 260;
    const root = 300 + (x - 300) * 0.25;
    const sway = Math.sin(t * 9 + rad) * 16;
    return `<path d="M${root} 152 C${x + sin * 24} ${165 + Math.sin(t * Math.PI) * 30} ${x - 18 + sin * 30} 350 ${x + sway} ${560 + Math.sin(t * 13) * 28}" stroke="${i % 4 === 0 ? "#fff" : i % 3 === 0 ? "#000" : color}" stroke-opacity="${i % 4 === 0 ? 0.12 : 0.3}" stroke-width="${i % 3 === 0 ? 2 : 1}" fill="none"/>`;
  }).join("");
  const facial = front
    ? `<path d="M${faceX - 28} 336 L${faceX - 32} 441 Q${faceX} 472 ${faceX + 37} 441 L${faceX + 27} 336" fill="url(#skin)"/><ellipse cx="${faceX}" cy="276" rx="${faceWidth}" ry="117" fill="url(#skin)"/>${cos > 0.5 ? `<path d="M${faceX - 53} 263q18-10 32 0m39 0q16-10 32 0" stroke="#4b413c" stroke-width="3" fill="none"/><path d="M${faceX + 4} 270l-7 38 14 2" stroke="#887369" stroke-width="2" fill="none"/><path d="M${faceX - 19} 336q20 9 37-1" stroke="#795e56" stroke-width="3" fill="none"/>` : `<path d="M${faceX + sin * 35} 266l${sin * 24} 39 ${-sin * 17} 6" stroke="#746157" stroke-width="3" fill="none"/><path d="M${faceX + sin * 5} 263q${sin * 19}-7 ${sin * 28} 0" stroke="#49413b" stroke-width="3" fill="none"/>`}`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><defs><radialGradient id="bg"><stop stop-color="#252527"/><stop offset="1" stop-color="#080809"/></radialGradient><linearGradient id="hair"><stop stop-color="#101012"/><stop offset=".28" stop-color="${color}"/><stop offset=".46" stop-color="${color}"/><stop offset=".73" stop-color="#17171a"/><stop offset=".9" stop-color="${color}"/><stop offset="1" stop-color="#141416"/></linearGradient><linearGradient id="skin"><stop stop-color="#594c45"/><stop offset=".4" stop-color="#b5a295"/><stop offset=".65" stop-color="#c4b3a4"/><stop offset="1" stop-color="#61534b"/></linearGradient><clipPath id="hairclip"><path d="M164 568C172 470 140 293 179 209C221 109 365 114 415 207C462 294 425 464 447 577Q390 617 363 553L237 559Q202 602 164 568Z"/></clipPath></defs><rect width="600" height="800" fill="url(#bg)"/><ellipse cx="300" cy="740" rx="172" ry="16" fill="#000" opacity=".5"/><path d="M135 770L149 511Q168 459 239 436L361 436Q435 459 451 511L465 770Z" fill="#111113"/><path d="M149 511Q175 476 225 463M375 463Q431 483 451 511" stroke="#3e3e41" fill="none"/><path d="M164 568C172 470 140 293 179 209C221 109 365 114 415 207C462 294 425 464 447 577Q390 617 363 553L237 559Q202 602 164 568Z" fill="url(#hair)"/><g clip-path="url(#hairclip)">${strands}</g>${facial}${front ? `<path d="M177 248C173 119 406 98 428 248Q383 218 350 180Q310 229 217 242L190 470Q178 335 177 248Z" fill="url(#hair)"/><g opacity=".35">${Array.from({ length: 26 }, (_, i) => `<path d="M${277 + i * 3} 149Q${224 + i * 6} 192 ${185 + i * 9} ${239 - Math.sin((i / 26) * Math.PI) * 34}" fill="none" stroke="${i % 3 ? "#fff" : "#000"}" stroke-opacity=".3"/>`).join("")}</g>` : ""}<path d="M153 675Q300 700 447 675" fill="none" stroke="#242426" stroke-width="1"/></svg>`;
}
for (const [name, color] of Object.entries(colors)) {
  await fs.mkdir(path.join("public", "hair", name), { recursive: true });
  for (let angle = 0; angle < 8; angle++) {
    await sharp(Buffer.from(render(color, angle)))
      .webp({ quality: 87 })
      .toFile(
        path.join(
          "public",
          "hair",
          name,
          `${String(angle + 1).padStart(2, "0")}.webp`,
        ),
      );
  }
}
console.log("Generated 64 original demo frames (8 angles × 8 colors).");
