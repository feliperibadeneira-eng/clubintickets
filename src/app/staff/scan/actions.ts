"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { checkInTicket, type CheckInResult } from "@/lib/checkin";

export async function scanTicket(
  scannedText: string,
  eventId: string,
): Promise<CheckInResult | { result: "INVALID"; reason: string }> {
  const user = await getCurrentUser();
  if (!user) return { result: "INVALID", reason: "Tu sesión expiró." };

  // El evento elegido en el <select> viene del cliente: hay que confirmar
  // que sea de la misma organización del staff antes de tocar nada, para
  // que una cuenta de una organización no pueda validar/anular entradas
  // de otra pasando un eventId ajeno (ver auditoría de seguridad).
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: user.organizationId },
    select: { id: true },
  });
  if (!event) return { result: "INVALID", reason: "Ese evento no existe." };

  return checkInTicket(scannedText, eventId, user.id);
}
