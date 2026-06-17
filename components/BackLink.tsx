import Link from "next/link";

export default function BackLink({ href, label = "Atrás" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
      ← {label}
    </Link>
  );
}
