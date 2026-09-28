import Link from "next/link";
import { notFound } from "next/navigation";
import { DollarSign, Ticket, UserCheck, Download, Pencil } from "lucide-react";
import { requireOrganizer } from "@/lib/auth";
import { getEventDashboard } from "@/lib/dashboard";
import { formatEventDate, formatUSD } from "@/lib/pricing";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { LiveRefresh } from "./LiveRefresh";

export const dynamic = "force-dynamic";

const resultTone: Record<string, "success" | "warning" | "danger"> = {
  GRANTED: "success",
  ALREADY_USED: "warning",
  INVALID: "danger",
};
const resultLabel: Record<string, string> = {
  GRANTED: "Ingresó",
  ALREADY_USED: "Ya había ingresado",
  INVALID: "Rechazado",
};

export default async function EventDashboardPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const user = await requireOrganizer();
  const { eventId } = await params;
  const dashboard = await getEventDashboard(eventId, user.organizationId);
  if (!dashboard) notFound();

  const { event, totals, ticketTypes, attendees, recentCheckIns } = dashboard;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <LiveRefresh />

      <Link
        href="/admin"
        className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
      >
        ← Todos los eventos
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
        <Link
          href={`/admin/eventos/${event.id}/editar`}
          className={buttonClasses("secondary", "sm")}
        >
          <Pencil size={14} />
          Editar evento
        </Link>
      </div>
      <p className="text-sm text-muted">
        {formatEventDate(event.startsAt)} · {event.venueName}
      </p>
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
        </span>
        Esta pantalla se actualiza sola cada 10 segundos.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat
          icon={<DollarSign size={16} />}
          label="Recaudado"
          value={formatUSD(totals.revenueCents)}
        />
        <Stat
          icon={<Ticket size={16} />}
          label="Vendidas"
          value={String(totals.ticketsSold)}
        />
        <Stat
          icon={<UserCheck size={16} />}
          label="Ingresaron"
          value={`${totals.checkedIn} / ${totals.ticketsSold}`}
        />
      </div>

      <h2 className="mt-9 text-lg font-semibold tracking-tight">
        Ventas por tipo de entrada
      </h2>
      <Card className="mt-3 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              <th className="p-3 font-medium">Tipo</th>
              <th className="p-3 font-medium">Vendidas</th>
              <th className="p-3 font-medium">Ingresaron</th>
              <th className="p-3 font-medium">Quedan</th>
              <th className="p-3 font-medium">Recaudado</th>
            </tr>
          </thead>
          <tbody>
            {ticketTypes.map((tt) => (
              <tr key={tt.id} className="border-t border-border">
                <td className="p-3 font-medium">{tt.name}</td>
                <td className="p-3">{tt.sold}</td>
                <td className="p-3">{tt.checkedIn}</td>
                <td className="p-3">{tt.remaining}</td>
                <td className="p-3">{formatUSD(tt.revenueCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-9 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          Asistentes ({attendees.length})
        </h2>
        <a
          href={`/admin/eventos/${event.id}/export`}
          className={buttonClasses("secondary", "sm")}
        >
          <Download size={14} />
          Exportar CSV
        </a>
      </div>
      <Card className="mt-3 max-h-96 overflow-y-auto p-0">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface text-left text-xs text-muted">
            <tr>
              <th className="p-3 font-medium">Nombre</th>
              <th className="p-3 font-medium">Cédula</th>
              <th className="p-3 font-medium">Tipo</th>
              <th className="p-3 font-medium">Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {attendees.map((a) => (
              <tr key={a.ticketId} className="border-t border-border">
                <td className="p-3">{a.attendeeName}</td>
                <td className="p-3 text-muted">{a.attendeeIdNumber}</td>
                <td className="p-3 text-muted">{a.ticketTypeName}</td>
                <td className="p-3">
                  {a.status === "USED" ? (
                    <span className="text-success">Sí</span>
                  ) : (
                    <span className="text-muted-2">No</span>
                  )}
                </td>
              </tr>
            ))}
            {attendees.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted">
                  Todavía no hay entradas vendidas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <h2 className="mt-9 text-lg font-semibold tracking-tight">
        Control de acceso en vivo
      </h2>
      <ul className="mt-3 space-y-2">
        {recentCheckIns.map((c) => (
          <li key={c.id}>
            <Card className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span>
                {c.attendeeName ?? "QR desconocido"}
                <span className="ml-2 text-sm text-muted">
                  escaneado por {c.staffName}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 text-sm">
                <Badge tone={resultTone[c.result]}>
                  {resultLabel[c.result]}
                </Badge>
                <span className="text-muted">
                  {new Intl.DateTimeFormat("es-EC", {
                    timeStyle: "medium",
                    timeZone: "America/Guayaquil",
                  }).format(c.scannedAt)}
                </span>
              </span>
            </Card>
          </li>
        ))}
        {recentCheckIns.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
            Todavía no hubo ningún escaneo en la puerta.
          </li>
        )}
      </ul>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-1.5 text-xs text-muted">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 text-xl font-bold tracking-tight">{value}</p>
    </Card>
  );
}
