export function AssessmentDisclaimer() {
  return (
    <aside
      aria-labelledby="disclaimer-title"
      className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300"
    >
      <h2 id="disclaimer-title" className="mb-2 font-semibold text-white">
        What this is — and is not
      </h2>
      <p>
        This is a recreational training and self-evaluation tool. Scores describe how you performed
        on these specific exercises, relative to their difficulty. They are not compared with
        population norms.
      </p>
      <p className="mt-2">
        It is <strong>not</strong> an IQ test, a psychometric instrument or a clinical or
        professional diagnosis, and it should not be used for hiring or any consequential decision.
      </p>
    </aside>
  );
}
