import React, { useState } from 'react';
import { FAMILY_DISPLAY_ID } from '../lib/scentNotesDict.ts';

interface ScentWheelProps {
  distribution: Record<string, number>;
  className?: string;
  size?: number;
}

export const ScentWheel: React.FC<ScentWheelProps> = ({
  distribution,
  className = '',
  size = 240
}) => {
  const [hoveredFamily, setHoveredFamily] = useState<string | null>(null);
  const [viewAsTable, setViewAsTable] = useState(false);

  const entries = Object.entries(distribution)
    .filter(([_, val]) => val > 0)
    .sort(([_, a], [__, b]) => b - a);

  const total = entries.reduce((acc, [_, val]) => acc + val, 0) || 1;

  if (entries.length === 0) {
    return (
      <div className={`p-6 text-center bg-[#f4f3e6] border border-[#d9d7c9] ${className}`}>
        <p className="text-[12px] text-[#5c5c5c]">
          Belum cukup data koleksi untuk membentuk Roda Aroma. Tambahkan minimal 2 parfum ke Pustakamu.
        </p>
      </div>
    );
  }

  const radius = size * 0.42;
  const innerRadius = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;

  let cumulativeAngle = -Math.PI / 2;

  // Locked monochrome fills for wheel slices
  const monoFills = ['#000000', '#333333', '#5c5c5c', '#8a8a8a', '#d9d7c9', '#f4f3e6'];

  const slices = entries.map(([family, val], index) => {
    const fraction = val / total;
    const angle = fraction * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const x3 = cx + innerRadius * Math.cos(endAngle);
    const y3 = cy + innerRadius * Math.sin(endAngle);
    const x4 = cx + innerRadius * Math.cos(startAngle);
    const y4 = cy + innerRadius * Math.sin(startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;
    const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;

    const norm = family.toLowerCase().split('/')[0].trim();
    const info = FAMILY_DISPLAY_ID[norm] || FAMILY_DISPLAY_ID.woody;

    return {
      family,
      val,
      percentage: Math.round((val / total) * 100),
      pathData,
      color: monoFills[index % monoFills.length],
      label: info.labelId
    };
  });

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="flex justify-between items-center w-full">
        <h4 className="text-[12px] font-medium uppercase tracking-wider text-[#000000]">
          Roda Olfaktori (Scent Wheel)
        </h4>
        <button
          onClick={() => setViewAsTable(!viewAsTable)}
          className="text-[12px] text-[#5c5c5c] hover:text-[#000000] underline font-medium"
        >
          {viewAsTable ? 'Lihat Grafik' : 'Lihat Tabel'}
        </button>
      </div>

      {viewAsTable ? (
        <div className="w-full overflow-hidden border border-[#d9d7c9] text-[12px]">
          <table className="w-full text-left">
            <thead className="bg-[#f4f3e6] text-[#5c5c5c]">
              <tr>
                <th className="p-2.5 font-medium">Keluarga Aroma</th>
                <th className="p-2.5 font-medium text-right">Porsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d9d7c9]">
              {slices.map((s) => (
                <tr key={s.family} className="hover:bg-[#f4f3e6]/60">
                  <td className="p-2.5 flex items-center gap-2">
                    <span className="w-3 h-3 border border-[#333333]" style={{ backgroundColor: s.color }} />
                    <span className="font-medium text-[#000000]">{s.label}</span>
                  </td>
                  <td className="p-2.5 text-right font-mono tabular-nums text-[#000000]">{s.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices.map((s) => {
              const isHovered = hoveredFamily === s.family;
              return (
                <path
                  key={s.family}
                  d={s.pathData}
                  fill={s.color}
                  stroke="#fffef2"
                  strokeWidth="2"
                  className="transition-transform duration-200 cursor-pointer hover:opacity-90"
                  style={{
                    transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                    transformOrigin: `${cx}px ${cy}px`
                  }}
                  onMouseEnter={() => setHoveredFamily(s.family)}
                  onMouseLeave={() => setHoveredFamily(null)}
                />
              );
            })}
            {/* Center cutout label */}
            <circle cx={cx} cy={cy} r={innerRadius - 4} fill="#fffef2" />
          </svg>

          {/* Center text tooltip */}
          <div className="absolute pointer-events-none text-center px-2">
            {hoveredFamily ? (
              <div>
                <p className="text-[12px] font-medium text-[#000000]">
                  {slices.find((s) => s.family === hoveredFamily)?.label}
                </p>
                <p className="text-[12px] text-[#5c5c5c] font-mono tabular-nums">
                  {slices.find((s) => s.family === hoveredFamily)?.percentage}%
                </p>
              </div>
            ) : (
              <div>
                <span className="text-[12px] uppercase tracking-widest text-[#5c5c5c] block">
                  DNA
                </span>
                <p className="text-[12px] text-[#000000]">
                  Senstoria
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chip Legend */}
      <div className="flex flex-wrap gap-2 justify-center max-w-xs">
        {slices.slice(0, 5).map((s) => (
          <div
            key={s.family}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] bg-[#f4f3e6] border border-[#d9d7c9]"
          >
            <span className="w-2.5 h-2.5 border border-[#333333]" style={{ backgroundColor: s.color }} />
            <span className="text-[#000000]">{s.label}</span>
            <span className="text-[#5c5c5c] font-mono tabular-nums">{s.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
