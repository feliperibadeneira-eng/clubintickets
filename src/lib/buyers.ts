import { prisma } from "@/lib/db";

export type BuyerOrderSummary = {
  id: string;
  status: string;
  totalCents: number;
  createdAt: Date;
  eventName: string;
  eventSlug: string;
  eventStartsAt: Date;
  ticketCount: number;
};

// Todas las compras de un comprador (cualquier evento, cualquier
// organización), más nuevas primero — lo que se muestra en "Mi cuenta".
export async function getBuyerOrders(
  email: string,
): Promise<BuyerOrderSummary[]> {
  const orders = await prisma.order.findMany({
    where: { buyerEmail: email.trim().toLowerCase() },
    include: { event: true, tickets: true },
    orderBy: { createdAt: "desc" },
  });
  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    totalCents: o.totalCents,
    createdAt: o.createdAt,
    eventName: o.event.name,
    eventSlug: o.event.slug,
    eventStartsAt: o.event.startsAt,
    ticketCount: o.tickets.length,
  }));
}
