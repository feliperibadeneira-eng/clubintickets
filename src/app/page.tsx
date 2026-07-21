import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatEventDate } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { startsAt: "asc" },
    include: { venue: true },
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold">Próximas fiestas</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Elegí un evento para comprar tus entradas.
      </p>

      <ul className="mt-8 space-y-4">
        {events.map((event) => (
          <li key={event.id}>
            <Link
              href={`/e/${event.slug}`}
              className="block rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
            >
              <h2 className="text-xl font-semibold">{event.name}</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {formatEventDate(event.startsAt)}
              </p>
              <p className="text-sm text-neutral-500">
                {event.venue.name} · {event.venue.city}
              </p>
            </Link>
          </li>
        ))}
        {events.length === 0 && (
          <li className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
            No hay eventos a la venta en este momento.
          </li>
        )}
      </ul>
    </main>
  );
}
