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

export interface ScentDnaRadarChartProps {
  familyBreakdown?: { family: string; percentage: number }[];
  familyPercentages?: Record<string, number>;
  height?: number;
}

/**
 * Secondary Recharts radar chart for Scent DNA distribution.
 * Displayed below horizontal bars on Library Scent DNA dashboard only.
 * Styling is strictly monochrome: stroke #333333, fill #333333 at 12% opacity, no color.
 */
export const ScentDnaRadarChart: React.FC<ScentDnaRadarChartProps> = ({
  familyBreakdown,
  familyPercentages,
  height = 260
}) => {
  // Map identical family names and percentages
  const chartData = React.useMemo(() => {
    if (familyBreakdown && familyBreakdown.length > 0) {
      return familyBreakdown.map(item => ({
        family: item.family,
        value: item.percentage,
        fullMark: 100
      }));
    }
    if (familyPercentages) {
      return Object.entries(familyPercentages).map(([family, value]) => ({
        family,
        value,
        fullMark: 100
      }));
    }
    return [];
  }, [familyBreakdown, familyPercentages]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center justify-center pt-2">
      <div style={{ width: '100%', height }} className="max-w-[360px] mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#d9d7c9" strokeDasharray="3 3" />
            <PolarAngleAxis 
              dataKey="family" 
              tick={{ 
                fill: '#000000', 
                fontSize: 12, 
                fontFamily: "'Hanken Grotesk', sans-serif", 
                fontWeight: 500 
              }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              stroke="#d9d7c9" 
              tick={{ fontSize: 10, fill: '#5c5c5c' }} 
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-[#333333] text-[#fffef2] px-2.5 py-1 text-xs font-mono tabular-nums border border-[#333333]">
                      <span className="font-sans font-medium">{item.family}: </span>
                      <span>{item.value}%</span>
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
              strokeWidth={1.5}
              fill="#333333"
              fillOpacity={0.12}
              dot={{ r: 2.5, fill: '#333333' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScentDnaRadarChart;
