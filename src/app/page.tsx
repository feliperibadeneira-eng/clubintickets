import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatEventDate } from "@/lib/pricing";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { startsAt: "asc" },
    include: { venue: true },
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Próximas fiestas
      </h1>
      <p className="mt-2 text-muted">
        Elegí un evento para comprar tus entradas.
      </p>

      <ul className="mt-8 space-y-3">
        {events.map((event) => (
          <li key={event.id}>
            <Link href={`/e/${event.slug}`}>
              <Card interactive className="group">
                <h2 className="text-lg font-semibold transition group-hover:text-accent">
                  {event.name}
                </h2>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-muted-2" />
                    {formatEventDate(event.startsAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-muted-2" />
                    {event.venue.name} · {event.venue.city}
                  </span>
                </div>
              </Card>
            </Link>
          </li>
        ))}
        {events.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-10 text-center text-muted">
            No hay eventos a la venta en este momento.
          </li>
        )}
      </ul>
    </main>
  );
}
