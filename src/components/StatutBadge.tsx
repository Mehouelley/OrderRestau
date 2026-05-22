interface StatutBadgeProps {
  status: 'nouvelle' | 'en_cours' | 'prete' | 'servie' | 'terminee';
  size?: 'sm' | 'md';
}

const config: Record<string, { label: string; color: string; dot: string }> = {
  nouvelle: { label: 'Nouvelle', color: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-400' },
  en_cours: { label: 'En cours', color: 'bg-orange-50 text-orange-700 ring-orange-200', dot: 'bg-orange-400' },
  prete: { label: 'Prête', color: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-400' },
  servie: { label: 'Servie', color: 'bg-gray-50 text-gray-500 ring-gray-200', dot: 'bg-gray-400' },
  terminee: { label: 'Terminée', color: 'bg-slate-50 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
};

export default function StatutBadge({ status, size = 'md' }: StatutBadgeProps) {
  const c = config[status] || config.nouvelle;
  return (
    <span
      className={`badge ring-1 ring-inset ${c.color} ${
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
