import React from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface ScentDnaRadarChartProps {
  familyPercentages: Record<string, number>;
  height?: number;
  interactive?: boolean;
}

export const ScentDnaRadarChart: React.FC<ScentDnaRadarChartProps> = ({
  familyPercentages,
  height = 280
}) => {
  const families = ['Woody', 'Floral', 'Fresh', 'Ambery', 'Gourmand', 'Aromatic'];

  const data = families.map(family => ({
    family,
    label: family,
    value: Math.round(familyPercentages[family] || 0),
    fullMark: 100
  }));

  const hasData = Object.values(familyPercentages).some(v => v > 0);

  // Fallback demo shape if no bottles yet
  const chartData = hasData 
    ? data 
    : [
        { family: 'Woody', label: 'Woody', value: 45, fullMark: 100 },
        { family: 'Floral', label: 'Floral', value: 30, fullMark: 100 },
        { family: 'Fresh', label: 'Fresh', value: 70, fullMark: 100 },
        { family: 'Ambery', label: 'Ambery', value: 25, fullMark: 100 },
        { family: 'Gourmand', label: 'Gourmand', value: 50, fullMark: 100 },
        { family: 'Aromatic', label: 'Aromatic', value: 40, fullMark: 100 },
      ];

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
      {!hasData && (
        <span className="absolute top-2 right-2 text-[10px] font-mono uppercase px-2 py-0.5 bg-[#F4F3E6] border border-[#D9D7C9] text-[#5C5C5C]">
          Sampel Profil
        </span>
      )}
      <div style={{ width: '100%', height }} className="max-w-[420px] mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#D9D7C9" strokeDasharray="3 3" />
            <PolarAngleAxis 
              dataKey="family" 
              tick={{ fill: '#333333', fontSize: 11, fontFamily: 'serif', fontWeight: 600 }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              stroke="#A89F91" 
              tick={{ fontSize: 9, fill: '#7A7A7A' }} 
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-[#1A1A1A] text-[#FFFEF2] px-2.5 py-1.5 text-xs shadow-md border border-neutral-700 font-mono">
                      <p className="font-serif font-bold text-sm text-[#E6C687]">{item.family}</p>
                      <p>{item.value}% dominansi</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Radar
              name="Scent DNA"
              dataKey="value"
              stroke="#8A4B14"
              strokeWidth={2}
              fill="#C28B58"
              fillOpacity={0.4}
              dot={{ r: 3, fill: '#8A4B14' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-[#5C5C5C] mt-1">
        {data.map(d => (
          <span key={d.family} className="px-2 py-0.5 bg-[#F4F3E6] border border-[#D9D7C9]">
            {d.family}: <strong className="text-black">{d.value}%</strong>
          </span>
        ))}
      </div>
    </div>
  );
};
