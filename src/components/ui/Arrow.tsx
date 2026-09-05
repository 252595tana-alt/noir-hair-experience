export function Arrow({
  direction = "right",
}: {
  direction?: "right" | "left" | "up";
}) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        transform:
          direction === "left"
            ? "rotate(180deg)"
            : direction === "up"
              ? "rotate(-45deg)"
              : undefined,
      }}
    >
      <path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
