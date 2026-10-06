export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl font-black text-accent-fg">
          P
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Pulso</h1>
        <p className="text-sm text-muted">Los mercados, explicados fácil</p>
      </div>
      {children}
    </main>
  );
}
