"use client";

import { Button } from "@/components/ui";

// Se muestra si algo falla al cargar una pantalla (p. ej. la base de datos no responde).
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface p-6 text-center">
      <h1 className="mb-2 text-xl font-semibold">Algo ha fallado al cargar esta pantalla</h1>
      <p className="mb-4 text-sm text-muted">
        Puede ser un fallo momentáneo de la base de datos o de la fuente de datos. Prueba de nuevo; si sigue igual, abre{" "}
        <a href="/login" className="text-accent">
          la página de entrada
        </a>
        , que te dirá si falta algo por configurar.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
