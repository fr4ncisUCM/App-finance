"use client";

import { useActionState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import type { AiState } from "@/app/actions/ai";
import { Markdown } from "./markdown";
import { Button } from "./ui";

/** Texto generado por IA con su botón para crearlo o actualizarlo. */
export function AiPanel({
  action,
  initial,
  cta,
  waiting,
  allowRefresh = true,
}: {
  action: () => Promise<AiState>;
  initial: AiState;
  cta: string;
  waiting: string;
  allowRefresh?: boolean;
}) {
  const [state, run, pending] = useActionState(async (prev: AiState) => {
    try {
      return await action();
    } catch {
      // Corte de red o tiempo de espera del servidor: se avisa sin perder el texto anterior.
      return { ...prev, error: "La petición se ha cortado o ha tardado demasiado. Vuelve a intentarlo." };
    }
  }, initial);
  const text = state?.text;

  if (pending) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-4 text-sm text-muted">
        <Loader2 size={18} className="animate-spin text-accent" />
        {waiting}
      </div>
    );
  }

  return (
    <div>
      {text && <Markdown text={text} />}
      {state?.error && <p className="mb-3 text-sm text-danger">{state.error}</p>}
      <form action={run} className="mt-3 flex items-center gap-3">
        {!text ? (
          <Button type="submit">
            <Sparkles size={16} /> {cta}
          </Button>
        ) : (
          allowRefresh && (
            <Button type="submit" variant="ghost" className="h-9 px-3 text-xs text-muted">
              <RefreshCw size={14} /> Actualizar
            </Button>
          )
        )}
        {state?.at && (
          <span className="text-xs text-muted">
            Generado a las{" "}
            {new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }).format(new Date(state.at))} · Texto de IA:
            puede contener errores.
          </span>
        )}
      </form>
    </div>
  );
}
