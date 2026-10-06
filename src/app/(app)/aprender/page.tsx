import { Fragment } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { Card, CardTitle, PageHeader } from "@/components/ui";
import { GLOSSARY, GUIDES } from "@/data/learn";
import { Glossary } from "./glossary";

export const metadata = { title: "Aprender" };

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
        p.startsWith("**") ? <strong key={i} className="text-text">{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}

export default function LearnPage() {
  return (
    <>
      <PageHeader title="Aprender" subtitle="Lo básico para entender lo que ves en la app, sin tecnicismos." />
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-3 xl:col-span-3">
          {GUIDES.map((g, i) => (
            <details key={g.id} open={i === 0} className="group rounded-2xl border border-border bg-surface">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent">{i + 1}</span>
                <span className="flex-1 font-semibold">{g.title}</span>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Clock size={13} /> {g.minutes} min
                </span>
                <ChevronDown size={18} className="text-muted transition group-open:rotate-180" />
              </summary>
              <div className="space-y-3 px-5 pb-5 leading-relaxed text-muted">
                {g.body.map((p, k) => (
                  <p key={k}>
                    <Rich text={p} />
                  </p>
                ))}
              </div>
            </details>
          ))}
          <p className="px-1 text-xs text-muted">
            Este contenido es divulgativo y no constituye asesoramiento financiero. Antes de invertir, infórmate bien y, si lo
            necesitas, consulta con un profesional.
          </p>
        </div>
        <Card className="xl:col-span-2">
          <CardTitle title="Glosario" />
          <Glossary terms={GLOSSARY} />
        </Card>
      </div>
    </>
  );
}
