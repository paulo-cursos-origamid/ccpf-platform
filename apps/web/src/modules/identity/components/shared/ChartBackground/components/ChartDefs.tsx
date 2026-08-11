export function ChartDefs() {
  return (
    <defs>
      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="var(--accent-primary)" />

        <stop offset="100%" stopColor="var(--accent-secondary)" />
      </linearGradient>

      <linearGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(34,197,94,.35)" />

        <stop offset="100%" stopColor="rgba(34,197,94,0)" />
      </linearGradient>
    </defs>
  );
}
