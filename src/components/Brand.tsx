import Link from "next/link";
import { Ticket } from "lucide-react";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 group">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white shadow-[0_4px_16px_-4px_var(--accent)]">
        <Ticket size={17} strokeWidth={2.5} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        Ticketera
      </span>
    </Link>
  );
}
