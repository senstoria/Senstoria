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
}

export const ScentDnaRadarChart: React.FC<ScentDnaRadarChartProps> = ({
  familyPercentages,
  height = 280
}) => {
  const families = ['Fresh', 'Woody', 'Floral', 'Ambery', 'Aromatic', 'Gourmand'];

  const data = families.map(f => ({
    family: f,
    label: f,
    value: familyPercentages[f] || 0,
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
        <span className="absolute top-2 right-2 text-[12px] font-mono uppercase px-2 py-0.5 bg-[#f4f3e6] border border-[#d9d7c9] text-[#5c5c5c]">
          Sampel Profil
        </span>
      )}
      <div style={{ width: '100%', height }} className="max-w-[420px] mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#d9d7c9" strokeDasharray="3 3" />
            <PolarAngleAxis 
              dataKey="family" 
              tick={{ fill: '#000000', fontSize: 12, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500 }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              stroke="#d9d7c9" 
              tick={{ fontSize: 12, fill: '#5c5c5c' }} 
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-[#333333] text-[#fffef2] px-3 py-1.5 text-[12px] border border-[#333333] font-mono tabular-nums">
                      <p className="font-sans font-medium text-[12px] text-[#fffef2]">{item.family}</p>
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
              stroke="#333333"
              strokeWidth={2}
              fill="#333333"
              fillOpacity={0.15}
              dot={{ r: 3, fill: '#333333' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-[12px] font-mono tabular-nums text-[#5c5c5c] mt-1">
        {data.map(d => (
          <span key={d.family} className="px-2 py-0.5 bg-[#f4f3e6] border border-[#d9d7c9]">
            {d.family}: <strong className="text-[#000000]">{d.value}%</strong>
          </span>
        ))}
      </div>
    </div>
  );
};
