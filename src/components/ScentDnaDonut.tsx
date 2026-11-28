import { dominantFamilyShare } from '../lib/senstoriaN10.ts';

const strokes = [
  'var(--color-ink)',
  'var(--color-warm)',
  'var(--color-brick)',
  'var(--color-muted)',
  'var(--color-stone)',
  'var(--color-photo)',
];

export function ScentDnaDonut({ familyBreakdown }: {
  familyBreakdown: { family: string; percentage: number }[];
}) {
  const families = familyBreakdown.filter(item => item.percentage > 0);
  const total = families.reduce((sum, item) => sum + item.percentage, 0);
  const top = dominantFamilyShare(families);
  if (!top) return null;
  let offset = 0;
  return (
    <figure data-testid="scent-dna-donut" className="mx-auto grid max-w-md justify-items-center gap-4">
      <svg aria-hidden="true" viewBox="0 0 120 120" className="size-48">
        {families.map(({ family, percentage }, index) => {
          const share = percentage / total * 100;
          const start = offset;
          offset += share;
          return <circle key={family} cx="60" cy="60" r="46" pathLength="100"
            fill="none" stroke={strokes[index % strokes.length]} strokeWidth="20"
            strokeDasharray={`${share} ${100 - share}`} strokeDashoffset={-start}
            transform="rotate(-90 60 60)" />;
        })}
        <text x="60" y="64" textAnchor="middle" className="fill-ink text-sm font-bold">{top.percentage}%</text>
      </svg>
      <figcaption className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-ink">
        {families.map((item, index) => (
          <span key={item.family} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3 rounded-full border border-ink/30"
              style={{ backgroundColor: strokes[index % strokes.length] }} />
            {item.family} {item.percentage}%
            {item === top && <strong className="rounded-full bg-ink px-2 py-0.5 text-[10px] text-white">TOP</strong>}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
