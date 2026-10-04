import Link from "next/link";
import { requireOrganizer } from "@/lib/auth";
import { listVenues } from "@/lib/eventManagement";
import { NewEventForm } from "./NewEventForm";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const user = await requireOrganizer();
  const venues = await listVenues(user.organizationId);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link
        href="/admin"
        className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
      >
        ← Todos los eventos
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Nuevo evento</h1>
      <p className="mt-1 text-sm text-muted">
        Se crea como borrador. Después le agregas los tipos de entrada y
        recién ahí lo publicas.
      </p>

      <NewEventForm venues={venues} />
    </main>
  );
}
