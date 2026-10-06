import { connection } from "next/server";
import { CircleCheck, CircleX } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal";
import { runDiagnostics } from "@/lib/diagnostics";

export const metadata = { title: "Diagnóstico" };

export default async function DiagnosticsPage() {
  await connection();
  await requireUser();
  const checks = await runDiagnostics();
  const groups = [...new Set(checks.map((c) => c.group))];

  return (
    <>
      <PageHeader
        title="Diagnóstico"
        subtitle="Comprueba ahora mismo, desde el servidor, cada fuente de datos que usa la app. Recarga la página para repetir."
      />
      <div className="grid max-w-5xl gap-6">
        {groups.map((g) => (
          <Card key={g}>
            <h2 className="mb-3 font-semibold">{g}</h2>
            <ul className="divide-y divide-border">
              {checks
                .filter((c) => c.group === g)
                .map((c) => (
                  <li key={c.name} className="flex items-start gap-3 py-2.5 text-sm">
                    {c.ok ? <CircleCheck size={18} className="mt-0.5 shrink-0 text-up" /> : <CircleX size={18} className="mt-0.5 shrink-0 text-down" />}
                    <span className="w-72 shrink-0 font-medium">{c.name}</span>
                    <span className={`min-w-0 flex-1 break-words ${c.ok ? "text-muted" : "text-down"}`}>{c.detail}</span>
                    <span className="tabular shrink-0 text-xs text-muted">{c.ms} ms</span>
                  </li>
                ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
