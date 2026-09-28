"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createStaffAction, type CreateStaffState } from "./actions";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StaffRow, type StaffData } from "./StaffRow";

export function StaffManager({ staff }: { staff: StaffData[] }) {
  const [adding, setAdding] = useState(staff.length === 0);
  const [state, formAction, pending] = useActionState<
    CreateStaffState,
    FormData
  >(createStaffAction, null);

  // Al crear bien, cerramos el formulario (los datos de la cuenta nueva
  // quedan visibles arriba, en la tarjeta de éxito). Si hay error, se
  // queda abierto para corregir.
  useEffect(() => {
    if (state && "ok" in state) setAdding(false);
  }, [state]);

  return (
    <div>
      {state && "ok" in state && (
        <Card className="mb-4 border-accent/30 bg-accent/10">
          <p className="text-sm font-medium text-accent">
            ¡Cuenta creada! Pasále estos datos — la contraseña no se vuelve a
            mostrar.
          </p>
          <p className="mt-2 text-sm">
            <span className="text-muted">Email:</span> {state.email}
          </p>
          <p className="font-mono text-base tracking-wide">{state.password}</p>
        </Card>
      )}

      <div className="space-y-3">
        {staff.map((s) => (
          <StaffRow key={s.id} staff={s} />
        ))}
        {staff.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
            Todavía no creaste ninguna cuenta de staff.
          </p>
        )}
      </div>

      {adding ? (
        <Card className="mt-4">
          <form action={formAction} className="space-y-3">
            <div>
              <Label htmlFor="staff-name">Nombre</Label>
              <Input id="staff-name" name="name" required placeholder="Ej: Juan Pérez" />
            </div>
            <div>
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                name="email"
                type="email"
                required
                placeholder="portero@ejemplo.com"
              />
            </div>
            <p className="text-xs text-muted">
              La contraseña se genera sola — te la mostramos acá apenas se
              cree la cuenta.
            </p>
            {state && "error" in state && (
              <p className="text-sm text-danger">{state.error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Creando…" : "Crear cuenta"}
              </Button>
              {staff.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setAdding(false)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
        >
          <Plus size={14} />
          Nueva cuenta de staff
        </button>
      )}
    </div>
  );
}
