// Límite de intentos fallidos de login, compartido entre organizador/staff
// (User) y comprador (Buyer) — ambos modelos tienen los mismos dos campos
// (failedLoginAttempts, lockedUntil). Sin esto, una contraseña se podía
// probar sin límite (ver auditoría de seguridad).
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

type Throttled = { failedLoginAttempts: number; lockedUntil: Date | null };

export function isLockedOut(account: Throttled): boolean {
  return !!account.lockedUntil && account.lockedUntil > new Date();
}

export function lockoutMessage(lockedUntil: Date): string {
  const minutes = Math.max(
    1,
    Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000),
  );
  return `Demasiados intentos fallidos. Prueba de nuevo en ${minutes} minuto${minutes === 1 ? "" : "s"}.`;
}

// Qué guardar después de un intento fallido: suma uno, y si llega al
// límite, bloquea la cuenta por un rato.
export function afterFailedAttempt(account: Throttled): Throttled {
  const attempts = account.failedLoginAttempts + 1;
  return {
    failedLoginAttempts: attempts,
    lockedUntil:
      attempts >= MAX_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
        : null,
  };
}

// Qué guardar después de un login exitoso: limpiar el contador.
export const afterSuccessfulLogin: Throttled = {
  failedLoginAttempts: 0,
  lockedUntil: null,
};
