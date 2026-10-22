import React, { useState } from 'react';
import { FAMILY_DISPLAY_ID } from '../lib/scentNotesDict.ts';

interface ScentWheelProps {
  distribution: Record<string, number>; // e.g. { woody: 35, floral: 25, citrus: 20, aromatic: 20 }
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
      <div className={`p-6 text-center rounded-[20px] bg-[#F6F4EC] dark:bg-[#222226] border border-[#E3E1D8] dark:border-[#333338] ${className}`}>
        <p className="text-sm text-[#77776F] dark:text-[#A3A39A]">
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

  const slices = entries.map(([family, val]) => {
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
      color: info.mid,
      deepColor: info.deep,
      label: info.labelId
    };
  });

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="flex justify-between items-center w-full">
        <h4 className="text-sm font-semibold tracking-wide text-[#25252A] dark:text-[#F5F5EC]">
          Roda Olfaktori (Scent Wheel)
        </h4>
        <button
          onClick={() => setViewAsTable(!viewAsTable)}
          className="text-xs text-[#A9651F] hover:underline dark:text-[#D68B3E] font-medium"
        >
          {viewAsTable ? 'Lihat Grafik' : 'Lihat Tabel'}
        </button>
      </div>

      {viewAsTable ? (
        <div className="w-full overflow-hidden rounded-[14px] border border-[#E3E1D8] dark:border-[#333338] text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#F6F4EC] dark:bg-[#222226] text-[#77776F] dark:text-[#A3A39A]">
              <tr>
                <th className="p-2.5 font-medium">Keluarga Aroma</th>
                <th className="p-2.5 font-medium text-right">Porsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E1D8] dark:divide-[#333338]">
              {slices.map((s) => (
                <tr key={s.family} className="hover:bg-black/5 dark:hover:bg-white/5">
                  <td className="p-2.5 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-medium text-[#25252A] dark:text-[#F5F5EC]">{s.label}</span>
                  </td>
                  <td className="p-2.5 text-right font-semibold">{s.percentage}%</td>
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
                  stroke="#FFFFF5"
                  strokeWidth="2"
                  className="transition-transform duration-200 cursor-pointer hover:opacity-90 dark:stroke-[#17171A]"
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
            <circle cx={cx} cy={cy} r={innerRadius - 4} fill="currentColor" className="text-[#FFFFF5] dark:text-[#17171A]" />
          </svg>

          {/* Center text tooltip */}
          <div className="absolute pointer-events-none text-center px-2">
            {hoveredFamily ? (
              <div>
                <p className="text-xs font-bold text-[#25252A] dark:text-[#F5F5EC]">
                  {slices.find((s) => s.family === hoveredFamily)?.label}
                </p>
                <p className="text-xs text-[#A9651F] dark:text-[#D68B3E] font-semibold">
                  {slices.find((s) => s.family === hoveredFamily)?.percentage}%
                </p>
              </div>
            ) : (
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#77776F] dark:text-[#A3A39A]">
                  DNA AROMA
                </span>
                <p className="text-xs font-serif italic text-[#25252A] dark:text-[#F5F5EC]">
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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-[#F6F4EC] dark:bg-[#222226] border border-[#E3E1D8] dark:border-[#333338]"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[#25252A] dark:text-[#F5F5EC]">{s.label}</span>
            <span className="text-[#77776F] dark:text-[#A3A39A] font-semibold">{s.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
