import { prisma } from "@/lib/db";
import { parseEcuadorDateTime } from "@/lib/datetime";

export { parseEcuadorDateTime, toEcuadorDateTimeLocal } from "@/lib/datetime";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ---------------------------------------------------------------------
// Sedes (Venue)
// ---------------------------------------------------------------------

export async function listVenues(organizationId: string) {
  return prisma.venue.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
}

export async function createVenue(
  organizationId: string,
  input: { name: string; address: string; city: string },
): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  const city = input.city.trim();
  if (name.length < 2) return { ok: false, error: "Falta el nombre de la sede." };
  if (city.length < 2) return { ok: false, error: "Falta la ciudad." };

  const venue = await prisma.venue.create({
    data: {
      organizationId,
      name,
      city,
      address: input.address.trim() || null,
    },
  });
  return { ok: true, data: { id: venue.id } };
}

// ---------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "evento";
  let candidate = root;
  let n = 1;
  while (await prisma.event.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}

export type EventInput = {
  name: string;
  description: string;
  venueId: string;
  startsAtLocal: string; // datetime-local
  endsAtLocal: string; // datetime-local, opcional
};

export async function createEvent(
  organizationId: string,
  input: EventInput,
): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (name.length < 3) return { ok: false, error: "Falta el nombre del evento." };

  const venue = await prisma.venue.findFirst({
    where: { id: input.venueId, organizationId },
  });
  if (!venue) return { ok: false, error: "Elige una sede válida." };

  const startsAt = parseEcuadorDateTime(input.startsAtLocal);
  if (!startsAt) return { ok: false, error: "Falta la fecha de inicio." };
  const endsAt = input.endsAtLocal
    ? parseEcuadorDateTime(input.endsAtLocal)
    : null;
  if (endsAt && endsAt <= startsAt)
    return { ok: false, error: "La hora de cierre debe ser después del inicio." };

  const slug = await uniqueSlug(name);
  const event = await prisma.event.create({
    data: {
      organizationId,
      venueId: venue.id,
      name,
      slug,
      description: input.description.trim() || null,
      startsAt,
      endsAt,
      status: "DRAFT",
    },
  });
  return { ok: true, data: { id: event.id } };
}

export async function updateEvent(
  eventId: string,
  organizationId: string,
  input: EventInput,
): Promise<ActionResult> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId },
  });
  if (!event) return { ok: false, error: "Evento no encontrado." };

  const name = input.name.trim();
  if (name.length < 3) return { ok: false, error: "Falta el nombre del evento." };

  const venue = await prisma.venue.findFirst({
    where: { id: input.venueId, organizationId },
  });
  if (!venue) return { ok: false, error: "Elige una sede válida." };

  const startsAt = parseEcuadorDateTime(input.startsAtLocal);
  if (!startsAt) return { ok: false, error: "Falta la fecha de inicio." };
  const endsAt = input.endsAtLocal
    ? parseEcuadorDateTime(input.endsAtLocal)
    : null;
  if (endsAt && endsAt <= startsAt)
    return { ok: false, error: "La hora de cierre debe ser después del inicio." };

  await prisma.event.update({
    where: { id: eventId },
    data: {
      name,
      venueId: venue.id,
      description: input.description.trim() || null,
      startsAt,
      endsAt,
    },
  });
  return { ok: true, data: undefined };
}

export async function setEventStatus(
  eventId: string,
  organizationId: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
): Promise<ActionResult> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId },
    include: { ticketTypes: { include: { priceTiers: true } } },
  });
  if (!event) return { ok: false, error: "Evento no encontrado." };

  if (status === "PUBLISHED") {
    const sellable = event.ticketTypes.some((tt) => tt.priceTiers.length > 0);
    if (!sellable) {
      return {
        ok: false,
        error:
          "Agrega al menos un tipo de entrada con un precio antes de publicar.",
      };
    }
  }

  await prisma.event.update({ where: { id: eventId }, data: { status } });
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------
// Tipos de entrada
// ---------------------------------------------------------------------

export type TicketTypeInput = {
  name: string;
  description: string;
  groupSize: number;
  totalStock: number;
};

async function assertEventOwnership(eventId: string, organizationId: string) {
  return prisma.event.findFirst({ where: { id: eventId, organizationId } });
}

export async function createTicketType(
  eventId: string,
  organizationId: string,
  input: TicketTypeInput,
): Promise<ActionResult<{ id: string }>> {
  const event = await assertEventOwnership(eventId, organizationId);
  if (!event) return { ok: false, error: "Evento no encontrado." };

  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Falta el nombre del tipo de entrada." };
  if (!Number.isInteger(input.groupSize) || input.groupSize < 1)
    return { ok: false, error: "Personas por unidad inválido." };
  if (!Number.isInteger(input.totalStock) || input.totalStock < 0)
    return { ok: false, error: "Stock inválido." };

  const maxSort = await prisma.ticketType.aggregate({
    where: { eventId },
    _max: { sortOrder: true },
  });

  const tt = await prisma.ticketType.create({
    data: {
      eventId,
      name,
      description: input.description.trim() || null,
      groupSize: input.groupSize,
      totalStock: input.totalStock,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });
  return { ok: true, data: { id: tt.id } };
}

export async function updateTicketType(
  ticketTypeId: string,
  organizationId: string,
  input: TicketTypeInput,
): Promise<ActionResult> {
  const tt = await prisma.ticketType.findFirst({
    where: { id: ticketTypeId, event: { organizationId } },
  });
  if (!tt) return { ok: false, error: "Tipo de entrada no encontrado." };

  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Falta el nombre del tipo de entrada." };
  if (!Number.isInteger(input.groupSize) || input.groupSize < 1)
    return { ok: false, error: "Personas por unidad inválido." };
  if (!Number.isInteger(input.totalStock) || input.totalStock < 0)
    return { ok: false, error: "Stock inválido." };

  // No dejar bajar el stock por debajo de lo ya vendido/reservado.
  const committed = await prisma.orderItem.aggregate({
    where: {
      ticketTypeId,
      order: {
        OR: [{ status: "PAID" }, { status: "PENDING", expiresAt: { gt: new Date() } }],
      },
    },
    _sum: { quantity: true },
  });
  const alreadyCommitted = committed._sum.quantity ?? 0;
  if (input.totalStock < alreadyCommitted) {
    return {
      ok: false,
      error: `Ya hay ${alreadyCommitted} vendidas o reservadas — no puedes bajar el stock de ese número.`,
    };
  }

  await prisma.ticketType.update({
    where: { id: ticketTypeId },
    data: {
      name,
      description: input.description.trim() || null,
      groupSize: input.groupSize,
      totalStock: input.totalStock,
    },
  });
  return { ok: true, data: undefined };
}

export async function deleteTicketType(
  ticketTypeId: string,
  organizationId: string,
): Promise<ActionResult> {
  const tt = await prisma.ticketType.findFirst({
    where: { id: ticketTypeId, event: { organizationId } },
    include: { _count: { select: { tickets: true, orderItems: true } } },
  });
  if (!tt) return { ok: false, error: "Tipo de entrada no encontrado." };
  if (tt._count.tickets > 0 || tt._count.orderItems > 0) {
    return {
      ok: false,
      error:
        "No se puede borrar: ya tiene ventas. Si quieres, pon el stock en 0 para dejar de venderlo.",
    };
  }

  await prisma.$transaction([
    prisma.priceTier.deleteMany({ where: { ticketTypeId } }),
    prisma.ticketType.delete({ where: { id: ticketTypeId } }),
  ]);
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------
// Tandas de precio
// ---------------------------------------------------------------------

export type PriceTierInput = {
  name: string;
  price: string; // dólares, como lo escribe el organizador (ej: "15.00")
  startsAtLocal: string;
  endsAtLocal: string;
};

function parsePriceToCents(price: string): number | null {
  const n = Number(price);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export async function createPriceTier(
  ticketTypeId: string,
  organizationId: string,
  input: PriceTierInput,
): Promise<ActionResult<{ id: string }>> {
  const tt = await prisma.ticketType.findFirst({
    where: { id: ticketTypeId, event: { organizationId } },
  });
  if (!tt) return { ok: false, error: "Tipo de entrada no encontrado." };

  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Falta el nombre de la tanda." };
  const priceCents = parsePriceToCents(input.price);
  if (priceCents === null) return { ok: false, error: "Precio inválido." };

  const startsAt = input.startsAtLocal
    ? parseEcuadorDateTime(input.startsAtLocal)
    : null;
  const endsAt = input.endsAtLocal
    ? parseEcuadorDateTime(input.endsAtLocal)
    : null;
  if (startsAt && endsAt && endsAt <= startsAt)
    return { ok: false, error: "El fin de la tanda debe ser después del inicio." };

  const pt = await prisma.priceTier.create({
    data: { ticketTypeId, name, priceCents, startsAt, endsAt },
  });
  return { ok: true, data: { id: pt.id } };
}

export async function updatePriceTier(
  priceTierId: string,
  organizationId: string,
  input: PriceTierInput,
): Promise<ActionResult> {
  const pt = await prisma.priceTier.findFirst({
    where: { id: priceTierId, ticketType: { event: { organizationId } } },
  });
  if (!pt) return { ok: false, error: "Tanda no encontrada." };

  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Falta el nombre de la tanda." };
  const priceCents = parsePriceToCents(input.price);
  if (priceCents === null) return { ok: false, error: "Precio inválido." };

  const startsAt = input.startsAtLocal
    ? parseEcuadorDateTime(input.startsAtLocal)
    : null;
  const endsAt = input.endsAtLocal
    ? parseEcuadorDateTime(input.endsAtLocal)
    : null;
  if (startsAt && endsAt && endsAt <= startsAt)
    return { ok: false, error: "El fin de la tanda debe ser después del inicio." };

  await prisma.priceTier.update({
    where: { id: priceTierId },
    data: { name, priceCents, startsAt, endsAt },
  });
  return { ok: true, data: undefined };
}

// Borrar una tanda siempre es seguro: las órdenes ya hechas guardan su
// propio precio "congelado" (OrderItem.unitPriceCents), no dependen de que
// la tanda siga existiendo.
export async function deletePriceTier(
  priceTierId: string,
  organizationId: string,
): Promise<ActionResult> {
  const pt = await prisma.priceTier.findFirst({
    where: { id: priceTierId, ticketType: { event: { organizationId } } },
  });
  if (!pt) return { ok: false, error: "Tanda no encontrada." };

  await prisma.priceTier.delete({ where: { id: priceTierId } });
  return { ok: true, data: undefined };
}

export async function getEventForEditing(
  eventId: string,
  organizationId: string,
) {
  return prisma.event.findFirst({
    where: { id: eventId, organizationId },
    include: {
      venue: true,
      ticketTypes: {
        orderBy: { sortOrder: "asc" },
        include: { priceTiers: { orderBy: { startsAt: "asc" } } },
      },
    },
  });
}
