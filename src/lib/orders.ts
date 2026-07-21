import { prisma } from "@/lib/db";
import { currentTier } from "@/lib/pricing";
import { Prisma } from "@/generated/prisma/client";

// Cuántos minutos vale la reserva de stock mientras el comprador paga.
export const RESERVATION_MINUTES = 10;

// Unidades ya comprometidas (vendidas o reservadas y sin expirar) por tipo
// de entrada. Todo lo demás del stock sigue disponible.
export async function committedUnits(
  eventId: string,
): Promise<Map<string, number>> {
  const rows = await prisma.$queryRaw<
    { ticketTypeId: string; units: bigint }[]
  >`
    SELECT oi."ticketTypeId", COALESCE(SUM(oi."quantity"), 0) AS units
    FROM "OrderItem" oi
    JOIN "Order" o ON o."id" = oi."orderId"
    WHERE o."eventId" = ${eventId}
      AND (
        o."status" = 'PAID'
        OR (o."status" = 'PENDING' AND o."expiresAt" > NOW())
      )
    GROUP BY oi."ticketTypeId"
  `;
  return new Map(rows.map((r) => [r.ticketTypeId, Number(r.units)]));
}

// Marca como expiradas las órdenes PENDING vencidas (y anula sus entradas).
// Se llama de forma oportunista; el conteo de stock ya las ignora igual.
export async function expireStaleOrders(eventId: string): Promise<void> {
  const stale = await prisma.order.findMany({
    where: { eventId, status: "PENDING", expiresAt: { lt: new Date() } },
    select: { id: true },
  });
  if (stale.length === 0) return;
  const ids = stale.map((o) => o.id);
  await prisma.$transaction([
    prisma.ticket.updateMany({
      where: { orderId: { in: ids } },
      data: { status: "VOID" },
    }),
    prisma.order.updateMany({
      where: { id: { in: ids }, status: "PENDING" },
      data: { status: "EXPIRED" },
    }),
  ]);
}

export type AttendeeInput = { fullName: string; idNumber: string };
export type SelectionInput = {
  ticketTypeId: string;
  quantity: number;
  attendees: AttendeeInput[]; // quantity × groupSize personas
};

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

// Crea la orden reservando stock de forma atómica: bloquea los tipos de
// entrada involucrados, cuenta lo comprometido y solo entonces inserta.
// Si dos personas compran "la última" a la vez, una gana y la otra recibe
// un mensaje claro — nunca se vende de más.
export async function createOrder(input: {
  eventSlug: string;
  buyerName: string;
  buyerEmail: string;
  selections: SelectionInput[];
}): Promise<CreateOrderResult> {
  const event = await prisma.event.findUnique({
    where: { slug: input.eventSlug, status: "PUBLISHED" },
    include: { ticketTypes: { include: { priceTiers: true } } },
  });
  if (!event) return { ok: false, error: "El evento no está disponible." };

  await expireStaleOrders(event.id);

  const now = new Date();
  const selections = input.selections.filter((s) => s.quantity > 0);
  if (selections.length === 0)
    return { ok: false, error: "No seleccionaste ninguna entrada." };

  // Validar selección y armar los items con el precio de la tanda vigente.
  const items: {
    ticketTypeId: string;
    quantity: number;
    unitPriceCents: number;
    tierName: string;
    groupSize: number;
    attendees: AttendeeInput[];
  }[] = [];
  for (const sel of selections) {
    const tt = event.ticketTypes.find((t) => t.id === sel.ticketTypeId);
    if (!tt) return { ok: false, error: "Tipo de entrada inválido." };
    if (!Number.isInteger(sel.quantity) || sel.quantity < 1 || sel.quantity > 10)
      return { ok: false, error: "Cantidad inválida." };
    const tier = currentTier(tt.priceTiers, now);
    if (!tier)
      return {
        ok: false,
        error: `"${tt.name}" no está a la venta en este momento.`,
      };
    const expected = sel.quantity * tt.groupSize;
    if (sel.attendees.length !== expected)
      return {
        ok: false,
        error: `Faltan datos de asistentes para "${tt.name}".`,
      };
    for (const a of sel.attendees) {
      if (a.fullName.trim().length < 3)
        return { ok: false, error: "Hay nombres de asistente incompletos." };
      if (!/^[0-9A-Za-z-]{5,20}$/.test(a.idNumber.trim()))
        return {
          ok: false,
          error: "Hay cédulas/pasaportes inválidos (5 a 20 letras o números).",
        };
    }
    items.push({
      ticketTypeId: tt.id,
      quantity: sel.quantity,
      unitPriceCents: tier.priceCents,
      tierName: tier.name,
      groupSize: tt.groupSize,
      attendees: sel.attendees,
    });
  }

  const totalCents = items.reduce(
    (sum, i) => sum + i.unitPriceCents * i.quantity,
    0,
  );
  const expiresAt = new Date(now.getTime() + RESERVATION_MINUTES * 60_000);

  try {
    const orderId = await prisma.$transaction(async (tx) => {
      // Bloquea las filas de TicketType hasta terminar: otra compra
      // simultánea de los mismos tipos espera su turno aquí.
      const typeIds = items.map((i) => i.ticketTypeId);
      await tx.$queryRaw`
        SELECT "id" FROM "TicketType"
        WHERE "id" IN (${Prisma.join(typeIds)})
        FOR UPDATE
      `;

      const committed = await tx.$queryRaw<
        { ticketTypeId: string; units: bigint }[]
      >`
        SELECT oi."ticketTypeId", COALESCE(SUM(oi."quantity"), 0) AS units
        FROM "OrderItem" oi
        JOIN "Order" o ON o."id" = oi."orderId"
        WHERE oi."ticketTypeId" IN (${Prisma.join(typeIds)})
          AND (
            o."status" = 'PAID'
            OR (o."status" = 'PENDING' AND o."expiresAt" > NOW())
          )
        GROUP BY oi."ticketTypeId"
      `;
      const committedMap = new Map(
        committed.map((r) => [r.ticketTypeId, Number(r.units)]),
      );

      for (const item of items) {
        const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId)!;
        const remaining =
          tt.totalStock - (committedMap.get(item.ticketTypeId) ?? 0);
        if (item.quantity > remaining) {
          throw new StockError(
            remaining <= 0
              ? `"${tt.name}" está agotada.`
              : `De "${tt.name}" quedan solo ${remaining} disponibles.`,
          );
        }
      }

      const order = await tx.order.create({
        data: {
          eventId: event.id,
          buyerName: input.buyerName.trim(),
          buyerEmail: input.buyerEmail.trim().toLowerCase(),
          totalCents,
          currency: event.currency,
          expiresAt,
          items: {
            create: items.map((i) => ({
              ticketTypeId: i.ticketTypeId,
              quantity: i.quantity,
              unitPriceCents: i.unitPriceCents,
              tierName: i.tierName,
            })),
          },
          tickets: {
            create: items.flatMap((i) =>
              i.attendees.map((a) => ({
                eventId: event.id,
                ticketTypeId: i.ticketTypeId,
                attendeeName: a.fullName.trim(),
                attendeeIdNumber: a.idNumber.trim(),
              })),
            ),
          },
        },
      });
      return order.id;
    });
    return { ok: true, orderId };
  } catch (e) {
    if (e instanceof StockError) return { ok: false, error: e.message };
    throw e;
  }
}

class StockError extends Error {}
