"use client";

import { useActionState } from "react";
import { FlaskConical } from "lucide-react";
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
    <div className="mt-8 rounded-2xl border border-dashed border-warning/40 bg-warning-bg p-6 text-center">
      <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-warning">
        <FlaskConical size={15} />
        Modo prueba: todavía no está conectado PayPhone
      </p>
      <p className="mt-1 text-sm text-warning/80">
        Este botón simula que el pago se completó, para poder seguir
        probando el resto del sistema. No mueve dinero real.
      </p>
      <form action={formAction} className="mt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-warning px-6 py-3 font-medium text-black transition enabled:hover:brightness-95 disabled:opacity-40"
        >
          {pending ? "Confirmando…" : "Simular pago exitoso"}
        </button>
      </form>
      {state?.error && (
        <p className="mt-3 text-sm text-danger">{state.error}</p>
      )}
    </div>
  );
}
