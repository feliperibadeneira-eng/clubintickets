import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

export { hashPassword, verifyPassword } from "@/lib/password";

// Cómo funciona esto, en simple:
// - La contraseña nunca se guarda tal cual, se guarda "encriptada"
//   (bcrypt: ni nosotros podemos ver la contraseña real, solo comparar).
// - Al iniciar sesión creamos una fila en la tabla Session con un código al
//   azar como id. Ese código (no la contraseña) es lo único que guarda la
//   cookie del navegador. Para cerrar la sesión de alguien, alcanza con
//   borrar esa fila — no hace falta tocar su contraseña.

const COOKIE_NAME = "session";
const SESSION_HOURS = 12; // dura lo que dura una noche de evento, con margen

export async function createSession(userId: string): Promise<void> {
  const session = await prisma.session.create({
    data: {
      id: randomUUID(),
      userId,
      expiresAt: new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000),
    },
  });
  const jar = await cookies();
  jar.set(COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const sessionId = jar.get(COOKIE_NAME)?.value;
  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }
  jar.delete(COOKIE_NAME);
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "ORGANIZER" | "STAFF";
  organizationId: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const sessionId = jar.get(COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date() || !session.user.active) {
    return null;
  }
  const { user } = session;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };
}
