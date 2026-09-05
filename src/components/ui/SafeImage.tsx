"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
export function SafeImage(props: ImageProps) {
  const [failed, setFailed] = useState<ImageProps["src"] | null>(null);
  return (
    <Image
      {...props}
      alt={props.alt}
      src={failed === props.src ? "/images/placeholder.svg" : props.src}
      onError={() => setFailed(props.src)}
    />
  );
}
