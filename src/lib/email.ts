import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { formatEventDate, formatUSD } from "@/lib/pricing";
import { ticketQrBuffer, ticketUrl } from "@/lib/qr";

// Mandamos los emails desde una cuenta de Gmail normal (con una
// "contraseña de aplicación", no la contraseña real de la cuenta) mientras
// no haya un dominio propio verificado en un proveedor de emails
// transaccional. El día que lo haya, esta función se puede volver a
// cambiar a Resend/SendGrid sin tocar nada del resto del sistema.
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const FROM = GMAIL_USER ? `Ticketera <${GMAIL_USER}>` : undefined;

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
}

export type SendTicketsResult =
  | { ok: true }
  | { ok: false; error: string };

// Manda el email con las entradas de una orden ya pagada. Es "mejor
// esfuerzo": si falla, no revierte el pago — solo se registra el error y
// el comprador igual puede ver sus entradas desde /orden/[id].
export async function sendTicketsEmail(
  orderId: string,
): Promise<SendTicketsResult> {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD)
    return {
      ok: false,
      error: "Falta configurar GMAIL_USER y GMAIL_APP_PASSWORD.",
    };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: { include: { venue: true } },
      tickets: { include: { ticketType: true } },
    },
  });
  if (!order) return { ok: false, error: "La orden no existe." };
  if (order.status !== "PAID")
    return { ok: false, error: "La orden todavía no está pagada." };

  const qrImages = await Promise.all(
    order.tickets.map(async (t) => ({
      ticket: t,
      buffer: await ticketQrBuffer(t.qrToken),
    })),
  );

  const ticketsHtml = qrImages
    .map(
      ({ ticket }, i) => `
        <div style="margin:24px 0;padding:16px;border:1px solid #e5e5e5;border-radius:12px;text-align:center;">
          <p style="margin:0 0 4px;font-weight:600;">${escapeHtml(ticket.attendeeName)}</p>
          <p style="margin:0 0 12px;color:#666;font-size:14px;">${escapeHtml(ticket.ticketType.name)} · ${escapeHtml(ticket.attendeeIdNumber)}</p>
          <img src="cid:qr-${i}" width="220" height="220" alt="Código QR de la entrada" />
          <p style="margin:12px 0 0;font-size:12px;">
            <a href="${ticketUrl(ticket.qrToken)}" style="color:#666;">Ver esta entrada online</a>
          </p>
        </div>`,
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="font-size:20px;">${escapeHtml(order.event.name)}</h1>
      <p style="color:#666;">
        ${escapeHtml(formatEventDate(order.event.startsAt))}<br/>
        ${escapeHtml(order.event.venue.name)} · ${escapeHtml(order.event.venue.city)}
      </p>
      <p>¡Gracias por tu compra, ${escapeHtml(order.buyerName)}! Total pagado: ${formatUSD(order.totalCents)}.</p>
      <p style="color:#666;font-size:14px;">
        Presenta el código QR de cada entrada en la puerta, junto con tu
        documento de identidad. Cada entrada es intransferible.
      </p>
      ${ticketsHtml}
    </div>`;

  try {
    await getTransporter().sendMail({
      from: FROM,
      to: order.buyerEmail,
      subject: `Tus entradas para ${order.event.name}`,
      html,
      attachments: qrImages.map(({ buffer }, i) => ({
        filename: `entrada-${i + 1}.png`,
        content: buffer,
        cid: `qr-${i}`,
      })),
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { emailSentAt: new Date() },
  });
  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
