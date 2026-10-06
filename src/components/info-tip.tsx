import { CircleHelp } from "lucide-react";

/** Icono «?» que muestra una explicación al pasar el ratón o enfocar con el teclado. */
export function InfoTip({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`group relative inline-flex align-middle ${className}`}>
      <button type="button" aria-label={text} className="text-muted/70 hover:text-accent focus:text-accent focus:outline-none">
        <CircleHelp size={14} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-40 mb-2 w-64 -translate-x-1/2 rounded-lg bg-text px-3 py-2 text-xs leading-relaxed font-normal text-bg opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
