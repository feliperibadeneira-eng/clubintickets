import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatEventDate } from "@/lib/pricing";
import { ticketQrDataUrl } from "@/lib/qr";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, { text: string; tone: "success" | "neutral" | "warning" | "danger" }> = {
  VALID: { text: "Válida — lista para usar", tone: "success" },
  USED: { text: "Ya fue usada en la puerta", tone: "neutral" },
  PENDING: { text: "Pago pendiente — todavía no es válida", tone: "warning" },
  VOID: { text: "Anulada", tone: "danger" },
  REFUNDED: { text: "Reembolsada", tone: "danger" },
};

// Página pública de una entrada individual: la que se linkea desde el email
// y desde la confirmación de compra. Es de solo lectura — no marca la
// entrada como usada (eso lo hace únicamente el staff en la puerta, en la
// siguiente parte de esta fase).
export default async function TicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { qrToken: token },
    include: { event: { include: { venue: true } }, ticketType: true },
  });
  if (!ticket) notFound();

  const qrDataUrl =
    ticket.status === "VALID" ? await ticketQrDataUrl(ticket.qrToken) : null;
  const label = statusLabel[ticket.status];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-10">
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="bg-accent/10 p-6 text-center">
          <p className="text-sm font-medium text-accent">
            {ticket.ticketType.name}
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight">
            {ticket.event.name}
          </h1>
          <div className="mt-3 flex flex-col items-center gap-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} className="text-muted-2" />
              {formatEventDate(ticket.event.startsAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} className="text-muted-2" />
              {ticket.event.venue.name} · {ticket.event.venue.city}
            </span>
          </div>
          <div className="mt-4 flex justify-center">
            <Badge tone={label.tone}>{label.text}</Badge>
          </div>
        </div>

        {/* Línea "perforada" tipo talón de entrada real. */}
        <div className="relative border-t border-dashed border-border">
          <div className="absolute -top-3 -left-3 h-6 w-6 rounded-full bg-background" />
          <div className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-background" />
        </div>

        <div className="flex flex-col items-center p-6">
          {qrDataUrl ? (
            <div className="rounded-2xl bg-white p-3">
              <Image
                src={qrDataUrl}
                alt="Código QR de la entrada"
                width={240}
                height={240}
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-[240px] w-[240px] items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted">
              Sin código QR
            </div>
          )}

          <div className="mt-6 w-full text-center">
            <p className="text-lg font-semibold">{ticket.attendeeName}</p>
            <p className="text-sm text-muted">{ticket.attendeeIdNumber}</p>
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-muted">
        Esta entrada es intransferible. Presenta este código QR en la puerta
        junto con tu documento de identidad.
      </p>
    </main>
  );
}
