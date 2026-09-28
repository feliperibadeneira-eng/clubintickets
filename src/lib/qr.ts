import QRCode from "qrcode";

// El QR codifica el link directo a la página de la entrada (no el token
// "pelado"), así cualquier lector de QR normal (no solo la app del staff)
// muestra algo útil si alguien lo escanea por curiosidad.
export function ticketUrl(qrToken: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return `${base}/t/${qrToken}`;
}

// PNG como data URL, para mostrar el QR directo en una etiqueta <img>.
export async function ticketQrDataUrl(qrToken: string): Promise<string> {
  return QRCode.toDataURL(ticketUrl(qrToken), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
  });
}

// PNG como buffer, para adjuntar/incrustar en el email.
export async function ticketQrBuffer(qrToken: string): Promise<Buffer> {
  return QRCode.toBuffer(ticketUrl(qrToken), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
  });
}
