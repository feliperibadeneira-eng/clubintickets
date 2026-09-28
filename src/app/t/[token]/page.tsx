import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatEventDate } from "@/lib/pricing";
import { ticketQrDataUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, { text: string; className: string }> = {
  VALID: {
    text: "Válida — lista para usar",
    className:
      "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  },
  USED: {
    text: "Ya fue usada en la puerta",
    className:
      "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  },
  PENDING: {
    text: "Pago pendiente — todavía no es válida",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  VOID: {
    text: "Anulada",
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  },
  REFUNDED: {
    text: "Reembolsada",
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  },
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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 py-10 text-center">
      <p className="text-sm text-neutral-500">{ticket.event.name}</p>
      <p className="mt-1 text-sm text-neutral-500">
        {formatEventDate(ticket.event.startsAt)}
      </p>
      <p className="text-sm text-neutral-500">
        {ticket.event.venue.name} · {ticket.event.venue.city}
      </p>

      <span
        className={`mt-4 rounded-full px-3 py-1 text-sm font-medium ${label.className}`}
      >
        {label.text}
      </span>

      {qrDataUrl ? (
        <Image
          src={qrDataUrl}
          alt="Código QR de la entrada"
          width={280}
          height={280}
          unoptimized
          className="mt-6 rounded-xl border border-neutral-200 dark:border-neutral-800"
        />
      ) : (
        <div className="mt-6 flex h-[280px] w-[280px] items-center justify-center rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-500 dark:border-neutral-700">
          Sin código QR
        </div>
      )}

      <div className="mt-6 w-full rounded-xl border border-neutral-200 p-4 text-left dark:border-neutral-800">
        <p className="text-lg font-semibold">{ticket.attendeeName}</p>
        <p className="text-sm text-neutral-500">
          {ticket.ticketType.name} · {ticket.attendeeIdNumber}
        </p>
      </div>

      <p className="mt-4 text-xs text-neutral-500">
        Esta entrada es intransferible. Presentá este código QR en la puerta
        junto con tu documento de identidad.
      </p>
    </main>
  );
}
