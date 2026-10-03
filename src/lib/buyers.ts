import { prisma } from "@/lib/db";

// Crea o actualiza la identidad del comprador a partir de una orden pagada.
// Se llama cuando se confirma un pago (ver confirmTestPayment en orders.ts,
// y el futuro webhook de PayPhone) para que ese email ya quede listo para
// pedir un link de ingreso a "Mi cuenta".
export async function upsertBuyerFromOrder(
  email: string,
  name: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  await prisma.buyer.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, name: name.trim() },
    // El nombre puede venir distinto en compras futuras (ej. compró para
    // alguien más); nos quedamos con el más reciente.
    update: { name: name.trim() },
  });
}

// Para la pantalla de "pedir link de ingreso": si ya existe un Buyer lo
// devuelve, y si no existe pero esa persona ya compró algo antes (de cuando
// todavía no existía esta función), lo crea a partir de su compra más
// reciente. Si el email nunca compró nada, devuelve null — no creamos
// cuentas de la nada ni le damos pistas a quien intenta adivinar emails.
export async function findOrBackfillBuyer(
  email: string,
): Promise<{ id: string; name: string; email: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.buyer.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) return existing;

  const latestOrder = await prisma.order.findFirst({
    where: { buyerEmail: normalizedEmail },
    orderBy: { createdAt: "desc" },
  });
  if (!latestOrder) return null;

  return prisma.buyer.create({
    data: { email: normalizedEmail, name: latestOrder.buyerName },
  });
}

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
