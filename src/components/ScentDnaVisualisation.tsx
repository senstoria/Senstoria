import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Locale } from '../lib/i18n.ts';
import { EmptyState } from './EmptyState.tsx';

export interface ScentDnaFamilyShare {
  family: string;
  percentage: number;
}

export interface ScentDnaVisualisationProps {
  familyBreakdown: ScentDnaFamilyShare[];
  perfumesCount: number;
  topNotes: string[];
  locale: Locale;
  renderRadar?: () => React.ReactNode;
  onNavigateToCatalog?: () => void;
  isDashboard?: boolean;
  className?: string;
}

/**
 * Validates Scent DNA shares.
 * Returns false if any family share is negative or the shares do not sum to exactly 100%.
 */
export function validateScentDnaData(breakdown: ScentDnaFamilyShare[]): boolean {
  if (!breakdown || breakdown.length === 0) return false;
  // If any family share is negative: invalid
  if (breakdown.some(item => typeof item.percentage !== 'number' || isNaN(item.percentage) || item.percentage < 0)) {
    return false;
  }
  // If shares do not sum to exactly 100%: invalid
  const sum = breakdown.reduce((acc, item) => acc + item.percentage, 0);
  if (Math.abs(sum - 100) > 0.001) {
    return false;
  }
  return true;
}

/**
 * Counts the number of distinct perfumes in the user's active library profile.
 */
export function countProfilePerfumes(
  bottles: { perfume_id: string; deleted_at?: string | null; status: string }[]
): number {
  const activeBottles = bottles.filter(
    b => !b.deleted_at && (b.status === 'in_use' || b.status === 'sealed' || b.status === 'finished')
  );
  const distinctPerfumeIds = new Set(activeBottles.map(b => b.perfume_id));
  return distinctPerfumeIds.size;
}

/**
 * Extracts top ranked notes across user's active bottles up to limit (default 8).
 */
export function extractRankedTopNotes(
  bottles: { perfume_id: string; deleted_at?: string | null; status: string }[],
  perfumes: { id: string; top_notes: string; heart_notes: string; base_notes: string }[],
  limit = 8
): string[] {
  const activeBottles = bottles.filter(
    b => !b.deleted_at && (b.status === 'in_use' || b.status === 'sealed' || b.status === 'finished')
  );
  const noteFreq: Record<string, number> = {};
  for (const b of activeBottles) {
    const p = perfumes.find(item => item.id === b.perfume_id);
    if (!p) continue;
    const notes = `${p.top_notes}, ${p.heart_notes}, ${p.base_notes}`
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 2);
    for (const n of notes) {
      noteFreq[n] = (noteFreq[n] || 0) + 1;
    }
  }
  return Object.entries(noteFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([note]) => note);
}

/**
 * Scent DNA Visualisation Component.
 * - Primary: Horizontal bar chart with one bar per family, family name + percentage visible as text,
 *   monochrome #333333 on #d9d7c9 track, animated per motion system.
 * - Secondary: Optional Recharts radar chart displayed below the bars on Library dashboard only.
 * - Accessible data table toggle ("View as table") with identical numbers.
 * - Caption: "Based on N perfumes" plus ranked dominant notes (top 8).
 * - Empty state when profile has fewer than 3 perfumes.
 * - Error state when data is invalid (negative share or sum !== 100%).
 */
export const ScentDnaVisualisation: React.FC<ScentDnaVisualisationProps> = ({
  familyBreakdown,
  perfumesCount,
  topNotes,
  locale,
  renderRadar,
  onNavigateToCatalog,
  isDashboard = false,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // 1. Data Integrity Validation: Never draw a chart from invalid data
  const isValid = validateScentDnaData(familyBreakdown);
  if (!isValid) {
    return (
      <div 
        data-testid="scent-dna-error"
        role="alert" 
        className={`p-4 bg-[#f4f3e6] border border-[#d9d7c9] text-xs space-y-1.5 ${className}`}
      >
        <div className="flex items-center gap-1.5 font-semibold text-[#000000]">
          <AlertCircle className="w-4 h-4 text-[#333333] shrink-0" aria-hidden="true" />
          <span>{locale === 'id' ? 'Data profil Scent DNA tidak valid' : 'Invalid Scent DNA profile data'}</span>
        </div>
        <p className="text-[#5c5c5c] leading-relaxed">
          {locale === 'id' 
            ? 'Distribusi keluarga olfaktif tidak dapat divisualisasikan karena nilai proporsi tidak konsisten (proporsi tidak boleh bernilai negatif dan total harus tepat 100%).' 
            : 'Olfactive family distribution cannot be rendered because proportions are inconsistent (shares cannot be negative and must sum to exactly 100%).'}
        </p>
      </div>
    );
  }

  // 2. Minimum 3 Perfumes Rule: No chart, no radar, no placeholder numbers
  if (perfumesCount < 3) {
    if (isDashboard) {
      return (
        <EmptyState
          title={locale === 'id' ? 'Profil Scent DNA Membutuhkan Minimal 3 Parfum' : 'Scent DNA Requires at Least 3 Fragrances'}
          body={locale === 'id' 
            ? 'Tambahkan minimal 3 parfum ke lemarimu untuk membentuk profil dan analisis DNA aroma personal.' 
            : 'Add at least 3 fragrances to your library to generate an accurate personal olfactory taste profile.'}
          ctaLabel={locale === 'id' ? 'Jelajahi Katalog' : 'Browse Catalog'}
          onCtaClick={() => onNavigateToCatalog ? onNavigateToCatalog() : undefined}
          iconType="shelf"
          className={className}
        />
      );
    }

    return (
      <div className={`space-y-2 pt-2 border-t border-[#d9d7c9] ${className}`}>
        <div className="flex justify-between text-xs text-[#000000]">
          <span className="font-medium text-[12px]">
            {locale === 'id' ? 'Dominasi Scent DNA' : 'Scent DNA Dominance'}
          </span>
          <span className="font-mono text-[12px] text-[#5c5c5c]">
            {perfumesCount}/3 {locale === 'id' ? 'parfum' : 'perfumes'}
          </span>
        </div>
        <p className="text-[12px] text-[#5c5c5c]">
          {locale === 'id' 
            ? 'Tambahkan minimal 3 parfum ke lemarimu untuk mengaktifkan analisis Scent DNA.' 
            : 'Add at least 3 fragrances to your library to activate Scent DNA analysis.'}
        </p>
        <button
          type="button"
          onClick={() => onNavigateToCatalog ? onNavigateToCatalog() : undefined}
          className="text-[12px] font-semibold text-[#000000] underline hover:no-underline cursor-pointer min-h-[32px] flex items-center"
        >
          {locale === 'id' ? 'Jelajahi Katalog →' : 'Browse Catalog →'}
        </button>
      </div>
    );
  }

  // Ranked top 8 notes
  const rankedNotes = topNotes.slice(0, 8);

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Visualisation Header & Accessible Table Toggle */}
      <div className="flex items-center justify-between gap-2 border-b border-[#d9d7c9] pb-2">
        <span className="text-[12px] uppercase tracking-wider font-semibold text-[#000000]">
          {isDashboard 
            ? (locale === 'id' ? 'Distribusi Keluarga Olfaktif' : 'Olfactive Family Distribution')
            : (locale === 'id' ? 'Dominasi Scent DNA' : 'Scent DNA Dominance')}
        </span>

        <button
          type="button"
          onClick={() => setViewMode(prev => prev === 'chart' ? 'table' : 'chart')}
          className="min-h-[32px] px-2.5 py-1 text-xs border border-[#8a8a8a] bg-white hover:bg-[#f4f3e6] text-[#000000] transition active:scale-[0.98] cursor-pointer"
          aria-label={viewMode === 'chart' 
            ? (locale === 'id' ? 'Lihat sebagai tabel data' : 'View as data table') 
            : (locale === 'id' ? 'Lihat sebagai grafik batang' : 'View as bar chart')}
        >
          {viewMode === 'chart' 
            ? (locale === 'id' ? 'Lihat tabel' : 'View as table') 
            : (locale === 'id' ? 'Lihat grafik' : 'View as chart')}
        </button>
      </div>

      {/* Primary: Horizontal Bar Chart View */}
      {viewMode === 'chart' ? (
        <div className="space-y-3">
          {familyBreakdown.map((item, idx) => (
            <div key={item.family} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#000000]">{item.family}</span>
                <span className="font-mono tabular-nums text-[#5c5c5c]">{item.percentage}%</span>
              </div>
              <div className="w-full bg-[#d9d7c9] h-2.5 overflow-hidden">
                <div 
                  className="bg-[#333333] h-full transition-all duration-300 animate-bar-grow origin-left"
                  style={{ 
                    width: `${item.percentage}%`,
                    animationDelay: `${idx * 30}ms`
                  }}
                ></div>
              </div>
            </div>
          ))}

          {/* Secondary Radar Chart (Shown below bars on Library dashboard only) */}
          {renderRadar && (
            <div className="pt-4 border-t border-[#d9d7c9]">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[12px] uppercase tracking-wider font-semibold text-[#5c5c5c]">
                  {locale === 'id' ? 'Peta Poligon Radar (Pandangan Sekunder)' : 'Radar Polygon View (Secondary)'}
                </span>
                <span className="text-[12px] font-mono text-[#5c5c5c]">
                  Monochrome · 12% Fill
                </span>
              </div>
              {renderRadar()}
            </div>
          )}
        </div>
      ) : (
        /* Accessible Data Table View: Identical Numbers */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">
              {locale === 'id' ? 'Tabel Distribusi Keluarga Scent DNA' : 'Scent DNA Distribution Table'}
            </caption>
            <thead>
              <tr className="border-b border-[#333333] text-[#000000] font-semibold">
                <th scope="col" className="py-2 pr-4">{locale === 'id' ? 'Keluarga Aroma' : 'Olfactive Family'}</th>
                <th scope="col" className="py-2 text-right font-mono">{locale === 'id' ? 'Proporsi (%)' : 'Share (%)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d9d7c9]">
              {familyBreakdown.map(item => (
                <tr key={item.family} className="hover:bg-[#f4f3e6]/60">
                  <td className="py-2 pr-4 text-[#000000] font-medium">{item.family}</td>
                  <td className="py-2 text-right font-mono tabular-nums text-[#000000]">{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#333333] font-semibold text-[#000000]">
                <td className="py-2 pr-4">{locale === 'id' ? 'Total' : 'Total'}</td>
                <td className="py-2 text-right font-mono tabular-nums">
                  {familyBreakdown.reduce((sum, i) => sum + i.percentage, 0)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Caption Line: Based on N perfumes + Top 8 Dominant Notes */}
      <div className="pt-3 border-t border-[#d9d7c9] text-xs text-[#5c5c5c] leading-relaxed">
        <span className="font-mono text-[12px] text-[#000000]">
          {locale === 'id' 
            ? `Berdasarkan ${perfumesCount} parfum` 
            : `Based on ${perfumesCount} perfumes`}
        </span>
        {rankedNotes.length > 0 && (
          <span className="text-[12px] text-[#333333]">
            {' · '}
            <span className="font-medium text-[#000000]">
              {locale === 'id' ? 'Notes dominan: ' : 'Dominant notes: '}
            </span>
            {rankedNotes.map((note, idx) => `${idx + 1}. ${note}`).join(' · ')}
          </span>
        )}
      </div>

    </div>
  );
};
