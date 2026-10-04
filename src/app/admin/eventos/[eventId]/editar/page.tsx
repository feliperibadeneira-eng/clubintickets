import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganizer } from "@/lib/auth";
import { getEventForEditing, listVenues } from "@/lib/eventManagement";
import { EventDetailsForm } from "./EventDetailsForm";
import { StatusControl } from "./StatusControl";
import { TicketTypesManager } from "./TicketTypesManager";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const user = await requireOrganizer();
  const { eventId } = await params;
  const { nuevo } = await searchParams;

  const [event, venues] = await Promise.all([
    getEventForEditing(eventId, user.organizationId),
    listVenues(user.organizationId),
  ]);
  if (!event) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link
        href="/admin"
        className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
      >
        ← Todos los eventos
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">
        Editar {event.name}
      </h1>

      {nuevo === "1" && (
        <p className="mt-3 rounded-xl border border-accent/25 bg-accent/10 p-3 text-sm text-accent">
          ¡Evento creado! Ahora agrégale al menos un tipo de entrada con un
          precio para poder publicarlo.
        </p>
      )}

      <div className="mt-6 space-y-6">
        <StatusControl eventId={event.id} status={event.status} />

        <EventDetailsForm
          eventId={event.id}
          name={event.name}
          description={event.description ?? ""}
          venueId={event.venueId}
          venues={venues}
          startsAt={event.startsAt}
          endsAt={event.endsAt}
        />

        <TicketTypesManager eventId={event.id} ticketTypes={event.ticketTypes} />
      </div>
    </main>
  );
}
