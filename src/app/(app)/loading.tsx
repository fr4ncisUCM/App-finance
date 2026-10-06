// Esqueleto que se muestra al instante al cambiar de pantalla mientras llegan los datos.
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Cargando">
      <div className="mb-2 h-8 w-40 rounded-lg bg-surface-2" />
      <div className="mb-5 h-4 w-28 rounded bg-surface-2" />
      <div className="mb-3 h-28 rounded-2xl bg-surface-2" />
      <div className="mb-3 h-20 rounded-2xl bg-surface-2" />
      <div className="mb-3 h-20 rounded-2xl bg-surface-2" />
      <div className="h-20 rounded-2xl bg-surface-2" />
    </div>
  );
}
