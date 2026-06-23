export function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-success/5 dark:bg-success/10 blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-[20%] right-[20%] w-72 h-72 rounded-full bg-warning/10 dark:bg-warning/20 blur-3xl animate-pulse" />
    </div>
  );
}
