"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createBuyerSession } from "@/lib/buyerAuth";

// Separado de la carga de la página (que solo lee, sin marcar nada como
// usado) para que abrir el link no lo consuma solo — algunos clientes de
// correo "pre-visitan" los links para revisar que no sean maliciosos, y eso
// gastaría el token antes de que la persona lo haga clic de verdad. Acá
// recién, al confirmar con este botón, se marca usado y se crea la sesión.
export async function confirmBuyerLogin(token: string): Promise<void> {
  const loginToken = await prisma.buyerLoginToken.findUnique({
    where: { id: token },
  });
  const valid =
    loginToken && !loginToken.usedAt && loginToken.expiresAt > new Date();

  if (!valid) {
    redirect("/cuenta/ingresar?expirado=1");
  }

  await prisma.buyerLoginToken.update({
    where: { id: token },
    data: { usedAt: new Date() },
  });
  await createBuyerSession(loginToken.buyerId);
  redirect("/cuenta");
}
