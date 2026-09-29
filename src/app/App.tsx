const AREAS = ['Logic', 'Memory', 'Speed', 'Attention', 'Patterns'] as const;

export function App() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <h1 className="text-4xl font-semibold tracking-tight">Train your programming mind.</h1>
      <ul className="mt-8 flex flex-wrap gap-3" aria-label="Cognitive areas">
        {AREAS.map((area) => (
          <li key={area} className="rounded-md border border-slate-700 px-3 py-1 font-mono text-sm">
            {area}
          </li>
        ))}
      </ul>
    </main>
  );
}
