import { prisma } from "@/lib/db";

export type CheckInResult =
  | {
      result: "GRANTED";
      attendeeName: string;
      ticketTypeName: string;
    }
  | {
      result: "ALREADY_USED";
      attendeeName: string;
      ticketTypeName: string;
      usedAt: Date;
      usedByName: string;
    }
  | { result: "INVALID"; reason: string };

// Extrae el token del contenido escaneado: puede ser el link completo
// (http://.../t/<token>, lo normal si viene de nuestro QR) o el token
// solo, por si algún día lo leemos de otra forma.
export function parseTicketToken(scannedText: string): string | null {
  const trimmed = scannedText.trim();
  const match = trimmed.match(/\/t\/([^/?#]+)/);
  if (match) return match[1];
  // Token "pelado": un uuid.
  if (/^[0-9a-f-]{20,40}$/i.test(trimmed)) return trimmed;
  return null;
}

// Valida y marca una entrada como usada. Es la única puerta de entrada real
// (SPEC.md sección 6): nunca confiamos en lo que diga la app del celular,
// siempre se decide acá, con un candado a nivel de fila para que dos
// escaneos del mismo QR al mismo instante no puedan pasar los dos.
export async function checkInTicket(
  scannedText: string,
  eventId: string,
  staffUserId: string,
): Promise<CheckInResult> {
  const token = parseTicketToken(scannedText);
  if (!token) {
    await prisma.checkIn.create({
      data: { eventId, userId: staffUserId, result: "INVALID" },
    });
    return { result: "INVALID", reason: "Ese código no es una entrada." };
  }

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      {
        id: string;
        eventId: string;
        status: string;
        attendeeName: string;
        usedAt: Date | null;
        usedByUserId: string | null;
        ticketTypeName: string;
      }[]
    >`
      SELECT t."id", t."eventId", t."status", t."attendeeName", t."usedAt",
             t."usedByUserId", tt."name" AS "ticketTypeName"
      FROM "Ticket" t
      JOIN "TicketType" tt ON tt."id" = t."ticketTypeId"
      WHERE t."qrToken" = ${token}
      FOR UPDATE OF t
    `;
    const ticket = rows[0];

    if (!ticket) {
      await tx.checkIn.create({
        data: { eventId, userId: staffUserId, result: "INVALID" },
      });
      return {
        result: "INVALID",
        reason: "Esa entrada no existe en el sistema.",
      };
    }

    if (ticket.eventId !== eventId) {
      await tx.checkIn.create({
        data: {
          eventId,
          ticketId: ticket.id,
          userId: staffUserId,
          result: "INVALID",
        },
      });
      return { result: "INVALID", reason: "Esta entrada es de otro evento." };
    }

    if (ticket.status === "USED") {
      await tx.checkIn.create({
        data: {
          eventId,
          ticketId: ticket.id,
          userId: staffUserId,
          result: "ALREADY_USED",
        },
      });
      const usedBy = ticket.usedByUserId
        ? await tx.user.findUnique({ where: { id: ticket.usedByUserId } })
        : null;
      return {
        result: "ALREADY_USED",
        attendeeName: ticket.attendeeName,
        ticketTypeName: ticket.ticketTypeName,
        usedAt: ticket.usedAt!,
        usedByName: usedBy?.name ?? "otro dispositivo",
      };
    }

    if (ticket.status !== "VALID") {
      const reasons: Record<string, string> = {
        PENDING: "Esta entrada todavía no está pagada.",
        VOID: "Esta entrada fue anulada.",
        REFUNDED: "Esta entrada fue reembolsada.",
      };
      await tx.checkIn.create({
        data: {
          eventId,
          ticketId: ticket.id,
          userId: staffUserId,
          result: "INVALID",
        },
      });
      return {
        result: "INVALID",
        reason: reasons[ticket.status] ?? "Esta entrada no es válida.",
      };
    }

    await tx.ticket.update({
      where: { id: ticket.id },
      data: { status: "USED", usedAt: new Date(), usedByUserId: staffUserId },
    });
    await tx.checkIn.create({
      data: {
        eventId,
        ticketId: ticket.id,
        userId: staffUserId,
        result: "GRANTED",
      },
    });
    return {
      result: "GRANTED",
      attendeeName: ticket.attendeeName,
      ticketTypeName: ticket.ticketTypeName,
    };
  });
}

export type EventOption = { id: string; name: string };

export async function eventsForOrganization(
  organizationId: string,
): Promise<EventOption[]> {
  const events = await prisma.event.findMany({
    where: { organizationId, status: { in: ["PUBLISHED", "DRAFT"] } },
    orderBy: { startsAt: "desc" },
    select: { id: true, name: true },
  });
  return events;
}
