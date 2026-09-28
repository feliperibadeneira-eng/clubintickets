import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function listStaff(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId, role: "STAFF" },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

// Contraseña temporal legible, sin caracteres que se confundan entre sí
// (0/O, 1/l/I). El organizador se la pasa al portero; puede cambiarla
// después "de generar una nueva" si hace falta.
const SAFE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function generatePassword(): string {
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += SAFE_CHARS[bytes[i] % SAFE_CHARS.length];
  }
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}

export async function createStaffAccount(
  organizationId: string,
  input: { name: string; email: string },
): Promise<ActionResult<{ email: string; password: string }>> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return { ok: false, error: "Falta el nombre." };
  if (!/^\S+@\S+\.\S+$/.test(email))
    return { ok: false, error: "El email no parece válido." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "Ya existe una cuenta con ese email." };

  const password = generatePassword();
  await prisma.user.create({
    data: {
      organizationId,
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "STAFF",
    },
  });
  return { ok: true, data: { email, password } };
}

export async function setStaffActive(
  userId: string,
  organizationId: string,
  active: boolean,
): Promise<ActionResult> {
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId, role: "STAFF" },
  });
  if (!user) return { ok: false, error: "Cuenta no encontrada." };

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { active } }),
    // Si se desactiva, cerramos cualquier sesión abierta ya mismo, en vez
    // de esperar a que falle en su próximo pedido.
    ...(active
      ? []
      : [prisma.session.deleteMany({ where: { userId } })]),
  ]);
  return { ok: true, data: undefined };
}

export async function resetStaffPassword(
  userId: string,
  organizationId: string,
): Promise<ActionResult<{ password: string }>> {
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId, role: "STAFF" },
  });
  if (!user) return { ok: false, error: "Cuenta no encontrada." };

  const password = generatePassword();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    // Fuerza a cerrar sesión en el dispositivo donde estaba usando la
    // contraseña vieja.
    prisma.session.deleteMany({ where: { userId } }),
  ]);
  return { ok: true, data: { password } };
}
