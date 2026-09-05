"use client";
import { useState, type CSSProperties } from "react";
import manifest from "@/data/imageManifest.json";
type Props = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  fill?: boolean;
  unoptimized?: boolean;
  sizes?: string;
  draggable?: boolean;
  "data-testid"?: string;
};
export function HairImage({ src, alt, priority = false, ...props }: Props) {
  const [failed, setFailed] = useState("");
  const [loaded, setLoaded] = useState("");
  const data = (
    manifest as Record<
      string,
      { width: number; height: number; widths: number[]; base: string }
    >
  )[src];
  const error = failed === src;
  return (
    <picture className="hair-picture" data-loaded={loaded===src}>
      {data &&
        !error &&
        ["avif", "webp"].map((format) => (
          <source
            key={format}
            type={`image/${format}`}
              sizes={props.sizes??"(max-width:430px) 100vw, (max-width:1024px) 60vw, 50vw"}
            srcSet={data.widths
              .map((width) => `${data.base}-${width}.${format} ${width}w`)
              .join(", ")}
          />
        ))}
      {/* Native picture is intentional: format fallbacks and original-resolution cap. */}
      <img
        className={props.className}
        style={props.style}
        data-testid={props["data-testid"]}
        src={
          error
            ? "/images/placeholder.svg"
            : data
              ? `${data.base}-${data.width}.jpg`
              : src
        }
        alt={alt}
        width={data?.width ?? 141}
        height={data?.height ?? 100}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        draggable={false}
        onError={() => setFailed(src)}
        onLoad={() => setLoaded(src)}
      />
    </picture>
  );
}
