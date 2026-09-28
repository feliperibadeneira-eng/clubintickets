import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { currentTier, nextTier, formatUSD, formatEventDate } from "@/lib/pricing";
import { committedUnits, expireStaleOrders } from "@/lib/orders";
import { TicketSelector, type SelectorItem } from "./TicketSelector";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      organization: true,
      venue: true,
      ticketTypes: {
        orderBy: { sortOrder: "asc" },
        include: { priceTiers: true },
      },
    },
  });
  if (!event) notFound();

  await expireStaleOrders(event.id);
  const committed = await committedUnits(event.id);

  const now = new Date();
  const items: SelectorItem[] = event.ticketTypes.map((tt) => {
    const tier = currentTier(tt.priceTiers, now);
    const upcoming = nextTier(tt.priceTiers, now);
    const remaining = Math.max(0, tt.totalStock - (committed.get(tt.id) ?? 0));
    return {
      id: tt.id,
      name: tt.name,
      description: tt.description,
      groupSize: tt.groupSize,
      priceCents: tier?.priceCents ?? null,
      tierName: tier && tt.priceTiers.length > 1 ? tier.name : null,
      priceRiseNote:
        tier && upcoming && upcoming.priceCents > tier.priceCents
          ? `Sube a ${formatUSD(upcoming.priceCents)} el ${new Intl.DateTimeFormat(
              "es-EC",
              { day: "numeric", month: "long", timeZone: "America/Guayaquil" },
            ).format(upcoming.startsAt!)}`
          : null,
      soldOut: remaining === 0,
      // Aviso de escasez solo cuando de verdad quedan pocas.
      lowStockNote:
        remaining > 0 && remaining <= 20 ? `¡Quedan ${remaining}!` : null,
      maxPerOrder: Math.min(10, remaining),
    };
  });

  return (
    <main className="flex-1">
      <div className="border-b border-border/60 bg-gradient-to-br from-accent/20 via-background to-background px-4 py-12">
        <div className="mx-auto w-full max-w-2xl">
          <p className="text-sm font-medium text-accent">
            {event.organization.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {event.name}
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} className="text-muted-2" />
              {formatEventDate(event.startsAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} className="text-muted-2" />
              {event.venue.name}
              {event.venue.address ? ` — ${event.venue.address}` : ""} ·{" "}
              {event.venue.city}
            </span>
          </div>
          {event.description && (
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
              {event.description}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <h2 className="text-xl font-semibold tracking-tight">Entradas</h2>
        <TicketSelector eventSlug={event.slug} items={items} />
      </div>
    </main>
  );
}
