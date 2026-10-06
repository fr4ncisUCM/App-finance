import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

// twMerge resuelve conflictos: una clase pasada por props (p. ej. "w-40") sustituye a la base ("w-full").
function cx(...classes: (string | false | null | undefined)[]) {
  return twMerge(classes.filter(Boolean).join(" "));
}

type ButtonProps = ComponentProps<"button"> & { variant?: "primary" | "secondary" | "ghost" | "danger" };

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-accent text-accent-fg hover:opacity-90",
    secondary: "bg-surface-2 text-text hover:bg-border",
    ghost: "text-text hover:bg-surface-2",
    danger: "bg-transparent text-danger border border-danger/40 hover:bg-danger/10",
  };
  return (
    <button
      className={cx(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cx(
        "h-11 w-full rounded-xl border border-border bg-surface px-3 text-text outline-none placeholder:text-muted focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cx(
        "h-11 w-full rounded-xl border border-border bg-surface px-3 text-text outline-none focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cx("mb-1 block text-sm font-medium text-muted", className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cx("rounded-2xl border border-border bg-surface p-5", className)} {...props} />;
}

export function FormMessage({ state }: { state?: { error?: string; ok?: string } }) {
  if (state?.error) return <p className="text-sm text-danger">{state.error}</p>;
  if (state?.ok) return <p className="text-sm text-success">{state.ok}</p>;
  return null;
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

export function CardTitle({ title, children, className }: { title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cx("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="flex items-center gap-1.5 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

/** Pestañas como enlaces (el estado vive en la URL). */
export function Tabs({ items, active }: { items: { href: string; label: string; id: string }[]; active: string }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-surface-2 p-1">
      {items.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={cx(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition",
            t.id === active ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export function Chip({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cx("inline-flex items-center rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium", className)}
      {...props}
    />
  );
}
