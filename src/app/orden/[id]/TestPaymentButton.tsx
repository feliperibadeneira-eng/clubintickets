"use client";

import { useActionState } from "react";
import { submitTestPayment, type TestPaymentState } from "./actions";

// Botón temporal para simular el pago mientras no tenemos PayPhone conectado
// (falta el RUC). Bien marcado como "modo prueba" para que nunca se confunda
// con un cobro real — se elimina cuando integremos la pasarela de verdad.
export function TestPaymentButton({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState<
    TestPaymentState,
    FormData
  >(submitTestPayment.bind(null, orderId), null);

  return (
    <div className="mt-8 rounded-xl border border-dashed border-amber-400 bg-amber-50 p-6 text-center dark:border-amber-700 dark:bg-amber-950">
      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
        Modo prueba: todavía no está conectado PayPhone
      </p>
      <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
        Este botón simula que el pago se completó, para poder seguir
        probando el resto del sistema. No mueve dinero real.
      </p>
      <form action={formAction} className="mt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-amber-600 px-6 py-3 font-medium text-white transition enabled:hover:bg-amber-700 disabled:opacity-40"
        >
          {pending ? "Confirmando…" : "Simular pago exitoso"}
        </button>
      </form>
      {state?.error && (
        <p className="mt-3 text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}
    </div>
  );
}
