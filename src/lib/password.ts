import bcrypt from "bcryptjs";

// Separado de auth.ts porque este archivo no depende de next/headers, así
// que también lo puede usar el script de seed (que corre fuera de un
// pedido HTTP, sin cookies disponibles).
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
