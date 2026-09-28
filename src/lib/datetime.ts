// Funciones puras de fecha/hora, sin ninguna dependencia del servidor
// (Prisma, etc.) — así las puede usar tanto código de servidor como
// componentes de cliente (formularios) sin arrastrar cosas que solo
// existen en Node.js al bundle del navegador.
//
// Ecuador está en UTC-5 todo el año (no tiene horario de verano), así que
// el offset es siempre el mismo — igual que en prisma/seed.ts.

export function parseEcuadorDateTime(value: string): Date | null {
  if (!value) return null;
  const d = new Date(`${value}:00-05:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Date -> valor para precargar un <input type="datetime-local"> mostrando
// la hora de Ecuador (el input siempre trabaja en "hora local sin huso").
export function toEcuadorDateTimeLocal(date: Date): string {
  const shifted = new Date(date.getTime() - 5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}
