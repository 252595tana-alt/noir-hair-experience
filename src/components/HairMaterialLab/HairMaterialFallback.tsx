import { useId } from "react";
import { materialPalette, type HairMaterialSelection } from "./model";

/** A static vector swatch keeps all choices usable if WebGL is unavailable. */
export function HairMaterialFallback({ selection }: { selection: HairMaterialSelection }) {
  const id = useId().replaceAll(":", "");
  const shine = selection.texture === "silky" ? 0.75 : selection.texture === "natural" ? 0.35 : 0.10;
  return (
    <svg viewBox="0 0 420 520" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.35" y2="1">
          <stop stopColor={materialPalette[selection.color]} />
          <stop offset=".4" stopColor={materialPalette[selection.color]} />
          <stop offset=".53" stopColor="#e4d6c9" stopOpacity={shine} />
          <stop offset=".65" stopColor={materialPalette[selection.color]} />
          <stop offset="1" stopColor={materialPalette[selection.color]} stopOpacity=".4" />
        </linearGradient>
      </defs>
      {Array.from({ length: 120 }, (_, i) => {
        const x = 97 + i * 1.9, end = 436 + Math.sin(i * 1.8) * 10 - Math.abs(i - 60) * 0.35;
        const path = selection.style === "wave"
          ? `M ${x} 64 C ${x - 58} 154, ${x + 85} 158, ${x + 18} 248 S ${x - 28} 350, ${x + 6} ${end}`
          : `M ${x} 64 C ${x + 4} 174, ${x + 18} 290, ${x + 4} ${end}`;
        return <path key={i} d={path} fill="none" stroke={`url(#${id})`} strokeWidth="2.3" opacity={0.65 + (i % 5) * 0.07} />;
      })}
    </svg>
  );
}
