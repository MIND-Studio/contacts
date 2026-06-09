"use client";

/** Initial-letter avatar circle, themed with the Mind primary token. */
export default function ContactAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "md" | "lg";
}) {
  const letter = (name.trim()[0] ?? "?").toUpperCase();
  const cls =
    size === "lg"
      ? "size-14 text-xl"
      : "size-9 text-sm";
  return (
    <span
      aria-hidden
      className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary`}
    >
      {letter}
    </span>
  );
}
