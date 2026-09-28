import Link from "next/link";
import { TicketX } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
        <TicketX size={26} />
      </div>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">
        No encontramos esta página
      </h1>
      <p className="mt-2 text-muted">
        Puede que el link esté vencido o mal escrito.
      </p>
      <Link href="/" className={buttonClasses("primary", "md", "mt-6")}>
        Volver al inicio
      </Link>
    </main>
  );
}
