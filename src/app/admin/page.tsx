import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { requireOrganizer } from "@/lib/auth";
import { listOrganizerEvents } from "@/lib/dashboard";
import { formatEventDate, formatUSD } from "@/lib/pricing";
import { logout } from "@/lib/session-actions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "accent" | "neutral" | "warning"> = {
  DRAFT: "warning",
  PUBLISHED: "accent",
  ARCHIVED: "neutral",
};
const statusLabel: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

export default async function AdminHomePage() {
  const user = await requireOrganizer();
  const events = await listOrganizerEvents(user.organizationId);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">Panel del organizador</p>
          <h1 className="text-2xl font-bold tracking-tight break-words">
            Hola, {user.name}
          </h1>
        </div>
        <form action={logout} className="shrink-0">
          <Button type="submit" variant="secondary" size="sm">
            Cerrar sesión
          </Button>
        </form>
      </div>

      <ul className="mt-8 space-y-3">
        {events.map((e) => (
          <li key={e.id}>
            <Link href={`/admin/eventos/${e.id}`}>
              <Card interactive>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{e.name}</h2>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted">
                      <CalendarDays size={14} className="text-muted-2" />
                      {formatEventDate(e.startsAt)} · {e.venueName}
                    </p>
                  </div>
                  <Badge tone={statusTone[e.status] ?? "neutral"}>
                    {statusLabel[e.status] ?? e.status}
                  </Badge>
                </div>
                <div className="mt-4 flex gap-6 text-sm">
                  <span>
                    <strong className="text-foreground">
                      {e.ticketsSold}
                    </strong>{" "}
                    <span className="text-muted">entradas vendidas</span>
                  </span>
                  <span>
                    <strong className="text-foreground">
                      {formatUSD(e.revenueCents)}
                    </strong>{" "}
                    <span className="text-muted">recaudado</span>
                  </span>
                </div>
              </Card>
            </Link>
          </li>
        ))}
        {events.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-10 text-center text-muted">
            Todavía no creaste ningún evento.
          </li>
        )}
      </ul>
    </main>
  );
}
