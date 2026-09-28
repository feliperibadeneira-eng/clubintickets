import { NextResponse } from "next/server";
import { requireOrganizer } from "@/lib/auth";
import { getEventDashboard } from "@/lib/dashboard";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await requireOrganizer();
  const { eventId } = await params;
  const dashboard = await getEventDashboard(eventId, user.organizationId);
  if (!dashboard) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }

  const header = [
    "Nombre",
    "Cedula_Pasaporte",
    "Tipo_entrada",
    "Ingreso",
    "Hora_ingreso",
    "Email_comprador",
  ];
  const rows = dashboard.attendees.map((a) => [
    a.attendeeName,
    a.attendeeIdNumber,
    a.ticketTypeName,
    a.status === "USED" ? "Sí" : "No",
    a.usedAt ? a.usedAt.toISOString() : "",
    a.buyerEmail,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const filename = `asistentes-${dashboard.event.slug}.csv`;
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
