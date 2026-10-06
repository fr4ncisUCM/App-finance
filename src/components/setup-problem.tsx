import { TriangleAlert } from "lucide-react";
import type { SetupProblem } from "@/lib/setup-check";

export function SetupProblemCard({ problem }: { problem: SetupProblem }) {
  return (
    <div className="rounded-2xl border border-danger/40 bg-surface p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-danger">
        <TriangleAlert size={18} /> {problem.title}
      </h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm">
        {problem.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      {problem.detail && <p className="mt-3 rounded-lg bg-surface-2 p-2 font-mono text-xs break-words text-muted">{problem.detail}</p>}
    </div>
  );
}
