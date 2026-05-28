interface StatusBadgeProps {
  state: 'ready' | 'warn' | 'error';
  label: string;
}

const stateStyles = {
  ready: 'border-primary/40 bg-primary/10 text-primary',
  warn: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-300'
};

export function StatusBadge({ state, label }: StatusBadgeProps) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${stateStyles[state]}`}>{label}</span>;
}
