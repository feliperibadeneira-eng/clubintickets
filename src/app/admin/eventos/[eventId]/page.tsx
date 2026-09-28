import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganizer } from "@/lib/auth";
import { getEventDashboard } from "@/lib/dashboard";
import { formatEventDate, formatUSD } from "@/lib/pricing";
import { LiveRefresh } from "./LiveRefresh";

export const dynamic = "force-dynamic";

const resultLabel: Record<string, { text: string; className: string }> = {
  GRANTED: { text: "Ingresó", className: "text-green-700 dark:text-green-400" },
  ALREADY_USED: {
    text: "Ya había ingresado",
    className: "text-amber-700 dark:text-amber-400",
  },
  INVALID: { text: "Rechazado", className: "text-red-700 dark:text-red-400" },
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
        className="text-sm text-neutral-500 underline underline-offset-4"
      >
        ← Todos los eventos
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{event.name}</h1>
      <p className="text-sm text-neutral-500">
        {formatEventDate(event.startsAt)} · {event.venueName}
      </p>
      <p className="mt-1 text-xs text-neutral-400">
        Esta pantalla se actualiza sola cada 10 segundos.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Recaudado" value={formatUSD(totals.revenueCents)} />
        <Stat label="Entradas vendidas" value={String(totals.ticketsSold)} />
        <Stat
          label="Ya ingresaron"
          value={`${totals.checkedIn} / ${totals.ticketsSold}`}
        />
      </div>

      <h2 className="mt-8 text-lg font-semibold">Ventas por tipo de entrada</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left dark:bg-neutral-900">
            <tr>
              <th className="p-3">Tipo</th>
              <th className="p-3">Vendidas</th>
              <th className="p-3">Ingresaron</th>
              <th className="p-3">Quedan</th>
              <th className="p-3">Recaudado</th>
            </tr>
          </thead>
          <tbody>
            {ticketTypes.map((tt) => (
              <tr key={tt.id} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="p-3 font-medium">{tt.name}</td>
                <td className="p-3">{tt.sold}</td>
                <td className="p-3">{tt.checkedIn}</td>
                <td className="p-3">{tt.remaining}</td>
                <td className="p-3">{formatUSD(tt.revenueCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Asistentes ({attendees.length})</h2>
        <a
          href={`/admin/eventos/${event.id}/export`}
          className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
        >
          Exportar CSV
        </a>
      </div>
      <div className="mt-3 max-h-96 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-neutral-100 text-left dark:bg-neutral-900">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Cédula</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {attendees.map((a) => (
              <tr
                key={a.ticketId}
                className="border-t border-neutral-200 dark:border-neutral-800"
              >
                <td className="p-3">{a.attendeeName}</td>
                <td className="p-3 text-neutral-500">{a.attendeeIdNumber}</td>
                <td className="p-3 text-neutral-500">{a.ticketTypeName}</td>
                <td className="p-3">
                  {a.status === "USED" ? (
                    <span className="text-green-700 dark:text-green-400">
                      Sí
                    </span>
                  ) : (
                    <span className="text-neutral-400">No</span>
                  )}
                </td>
              </tr>
            ))}
            {attendees.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-neutral-500">
                  Todavía no hay entradas vendidas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Control de acceso en vivo</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {recentCheckIns.map((c) => {
          const label = resultLabel[c.result];
          return (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800"
            >
              <span>
                {c.attendeeName ?? "QR desconocido"}
                <span className="ml-2 text-neutral-500">
                  · escaneado por {c.staffName}
                </span>
              </span>
              <span className={label.className}>
                {label.text} ·{" "}
                {new Intl.DateTimeFormat("es-EC", {
                  timeStyle: "medium",
                  timeZone: "America/Guayaquil",
                }).format(c.scannedAt)}
              </span>
            </li>
          );
        })}
        {recentCheckIns.length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-500 dark:border-neutral-700">
            Todavía no hubo ningún escaneo en la puerta.
          </li>
        )}
      </ul>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
