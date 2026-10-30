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
import { PALETTE } from '../lib/palette.ts';

export interface ScentDnaRadarChartProps {
  familyBreakdown?: { family: string; percentage: number }[];
  familyPercentages?: Record<string, number>;
  height?: number;
}

/**
 * Secondary Recharts radar chart for Scent DNA distribution.
 * Displayed below horizontal bars on Library Scent DNA dashboard only.
 * Styling is strictly monochrome: bar stroke/fill at 12% opacity (PALETTE), no color.
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
            <PolarGrid stroke={PALETTE.hairline} strokeDasharray="3 3" />
            <PolarAngleAxis 
              dataKey="family" 
              tick={{ 
                fill: PALETTE.ink, 
                fontSize: 12, 
                fontFamily: "'Hanken Grotesk', sans-serif", 
                fontWeight: 500 
              }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              stroke={PALETTE.hairline} 
              tick={{ fontSize: 12, fill: PALETTE.secondary }} 
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-bar text-paper px-2.5 py-1 text-xs font-mono tabular-nums border border-bar">
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
              stroke={PALETTE.bar}
              strokeWidth={1.5}
              fill={PALETTE.bar}
              fillOpacity={0.12}
              dot={{ r: 2.5, fill: PALETTE.bar }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScentDnaRadarChart;
