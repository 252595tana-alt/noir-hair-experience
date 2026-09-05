import Link from "next/link";
export default function NotFound() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "#050505",
        display: "grid",
        placeContent: "center",
        textAlign: "center",
        gap: 24,
      }}
    >
      <h1>404 / NOT FOUND</h1>
      <Link href="/">ホームへ戻る →</Link>
    </div>
  );
}
