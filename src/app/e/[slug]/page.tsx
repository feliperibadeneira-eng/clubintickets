import { notFound } from "next/navigation";
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <p className="text-sm text-neutral-500">{event.organization.name}</p>
      <h1 className="text-3xl font-bold">{event.name}</h1>
      <div className="mt-2 space-y-0.5 text-sm text-neutral-500">
        <p>{formatEventDate(event.startsAt)}</p>
        <p>
          {event.venue.name}
          {event.venue.address ? ` — ${event.venue.address}` : ""} ·{" "}
          {event.venue.city}
        </p>
      </div>
      {event.description && (
        <p className="mt-4 text-neutral-700 dark:text-neutral-300">
          {event.description}
        </p>
      )}

      <h2 className="mt-10 text-xl font-semibold">Entradas</h2>
      <TicketSelector eventSlug={event.slug} items={items} />
    </main>
  );
}
