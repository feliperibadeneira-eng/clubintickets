import { prisma } from "@/lib/db";
import { committedUnits } from "@/lib/orders";

export type OrganizerEventSummary = {
  id: string;
  name: string;
  slug: string;
  startsAt: Date;
  status: string;
  venueName: string;
  ticketsSold: number;
  revenueCents: number;
};

export async function listOrganizerEvents(
  organizationId: string,
): Promise<OrganizerEventSummary[]> {
  const events = await prisma.event.findMany({
    where: { organizationId },
    orderBy: { startsAt: "desc" },
    include: {
      venue: true,
      tickets: { where: { status: { in: ["VALID", "USED"] } } },
      orders: { where: { status: "PAID" } },
    },
  });

  return events.map((e) => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    startsAt: e.startsAt,
    status: e.status,
    venueName: e.venue.name,
    ticketsSold: e.tickets.length,
    revenueCents: e.orders.reduce((sum, o) => sum + o.totalCents, 0),
  }));
}

export type TicketTypeSummary = {
  id: string;
  name: string;
  totalStock: number;
  sold: number;
  checkedIn: number;
  remaining: number;
  revenueCents: number;
};

export type AttendeeRow = {
  ticketId: string;
  attendeeName: string;
  attendeeIdNumber: string;
  ticketTypeName: string;
  status: "VALID" | "USED";
  usedAt: Date | null;
  buyerEmail: string;
};

export type CheckInFeedRow = {
  id: string;
  result: "GRANTED" | "ALREADY_USED" | "INVALID";
  scannedAt: Date;
  staffName: string;
  attendeeName: string | null;
};

export type EventDashboard = {
  event: {
    id: string;
    name: string;
    slug: string;
    startsAt: Date;
    venueName: string;
  };
  totals: {
    revenueCents: number;
    ticketsSold: number;
    checkedIn: number;
  };
  ticketTypes: TicketTypeSummary[];
  attendees: AttendeeRow[];
  recentCheckIns: CheckInFeedRow[];
};

// Todo lo que necesita la pantalla /admin/eventos/[eventId] en una sola
// consulta agrupada. organizationId scopea el acceso: un organizador nunca
// puede ver el evento de otra organización adivinando el id en la URL.
export async function getEventDashboard(
  eventId: string,
  organizationId: string,
): Promise<EventDashboard | null> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId },
    include: {
      venue: true,
      ticketTypes: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!event) return null;

  const [tickets, committed, checkIns, orderItems] = await Promise.all([
    prisma.ticket.findMany({
      where: { eventId, status: { in: ["VALID", "USED"] } },
      include: { ticketType: true, order: true },
      orderBy: { attendeeName: "asc" },
    }),
    committedUnits(eventId),
    prisma.checkIn.findMany({
      where: { eventId },
      include: { ticket: true, user: true },
      orderBy: { scannedAt: "desc" },
      take: 30,
    }),
    prisma.orderItem.findMany({
      where: { order: { eventId, status: "PAID" } },
    }),
  ]);

  const revenueByTicketType = new Map<string, number>();
  for (const item of orderItems) {
    revenueByTicketType.set(
      item.ticketTypeId,
      (revenueByTicketType.get(item.ticketTypeId) ?? 0) +
        item.unitPriceCents * item.quantity,
    );
  }

  const ticketTypes: TicketTypeSummary[] = event.ticketTypes.map((tt) => {
    const soldTickets = tickets.filter((t) => t.ticketTypeId === tt.id);
    return {
      id: tt.id,
      name: tt.name,
      totalStock: tt.totalStock,
      sold: soldTickets.length,
      checkedIn: soldTickets.filter((t) => t.status === "USED").length,
      remaining: Math.max(
        0,
        tt.totalStock - (committed.get(tt.id) ?? 0),
      ),
      revenueCents: revenueByTicketType.get(tt.id) ?? 0,
    };
  });

  const attendees: AttendeeRow[] = tickets.map((t) => ({
    ticketId: t.id,
    attendeeName: t.attendeeName,
    attendeeIdNumber: t.attendeeIdNumber,
    ticketTypeName: t.ticketType.name,
    status: t.status as "VALID" | "USED",
    usedAt: t.usedAt,
    buyerEmail: t.order.buyerEmail,
  }));

  const recentCheckIns: CheckInFeedRow[] = checkIns.map((c) => ({
    id: c.id,
    result: c.result,
    scannedAt: c.scannedAt,
    staffName: c.user.name,
    attendeeName: c.ticket?.attendeeName ?? null,
  }));

  return {
    event: {
      id: event.id,
      name: event.name,
      slug: event.slug,
      startsAt: event.startsAt,
      venueName: event.venue.name,
    },
    totals: {
      revenueCents: ticketTypes.reduce((s, t) => s + t.revenueCents, 0),
      ticketsSold: tickets.length,
      checkedIn: tickets.filter((t) => t.status === "USED").length,
    },
    ticketTypes,
    attendees,
    recentCheckIns,
  };
}
