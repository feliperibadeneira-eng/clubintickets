import Link from "next/link";
import { requireOrganizer } from "@/lib/auth";
import { listOrganizerEvents } from "@/lib/dashboard";
import { formatEventDate, formatUSD } from "@/lib/pricing";
import { logout } from "@/lib/session-actions";

export const dynamic = "force-dynamic";

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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Panel del organizador</p>
          <h1 className="text-2xl font-bold">Hola, {user.name}</h1>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      <ul className="mt-8 space-y-3">
        {events.map((e) => (
          <li key={e.id}>
            <Link
              href={`/admin/eventos/${e.id}`}
              className="block rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{e.name}</h2>
                  <p className="text-sm text-neutral-500">
                    {formatEventDate(e.startsAt)} · {e.venueName}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium dark:bg-neutral-800">
                  {statusLabel[e.status] ?? e.status}
                </span>
              </div>
              <div className="mt-3 flex gap-6 text-sm">
                <span>
                  <strong>{e.ticketsSold}</strong> entradas vendidas
                </span>
                <span>
                  <strong>{formatUSD(e.revenueCents)}</strong> recaudado
                </span>
              </div>
            </Link>
          </li>
        ))}
        {events.length === 0 && (
          <li className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
            Todavía no creaste ningún evento.
          </li>
        )}
      </ul>
    </main>
  );
}
