import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDnaDimensionDominants,
  dominantFamilyShare,
  findTopTie,
  mostCommonValue,
} from './senstoriaN10.ts';

test('Fase N10 — mostCommonValue: highest count wins; ties break alphabetically', () => {
  assert.deepEqual(mostCommonValue(['b', 'a', 'b']), { value: 'b', count: 2 });
  // Tie 1–1: alphabetical winner, deterministic (never bottle order).
  assert.deepEqual(mostCommonValue(['woody', 'floral']), { value: 'floral', count: 1 });
  assert.deepEqual(mostCommonValue(['floral', 'woody']), { value: 'floral', count: 1 });
  assert.equal(mostCommonValue([]), null);
  assert.equal(mostCommonValue([null, undefined, '']), null);
});

test('Fase N10 — computeDnaDimensionDominants: dominant band + gender from owned bottles only', () => {
  const bottles = [
    { perfume_id: 'p1', status: 'in_use' },
    { perfume_id: 'p2', status: 'sealed' },
    { perfume_id: 'p3', status: 'finished' },
    { perfume_id: 'p4', status: 'in_use', deleted_at: '2026-11-01' }, // deleted: ignored
    { perfume_id: 'p5', status: 'wishlist' }, // not an owned bottle: ignored
  ];
  const perfumes = [
    { id: 'p1', longevity_expected_band: '6-8h', gender_label: 'feminine' },
    { id: 'p2', longevity_expected_band: '6-8h', gender_label: 'masculine' },
    { id: 'p3', longevity_expected_band: '2-4h', gender_label: 'feminine' },
    { id: 'p4', longevity_expected_band: '8h+', gender_label: 'masculine' },
    { id: 'p5', longevity_expected_band: '8h+', gender_label: 'masculine' },
  ];
  assert.deepEqual(computeDnaDimensionDominants(bottles, perfumes), {
    longevity: '6-8h',
    gender: 'feminine',
  });
});

test('Fase N10 — computeDnaDimensionDominants: unknown values are skipped, never guessed', () => {
  const bottles = [{ perfume_id: 'p1', status: 'in_use' }];
  const perfumes = [{ id: 'p1', longevity_expected_band: 'unknown', gender_label: 'unknown' }];
  assert.deepEqual(computeDnaDimensionDominants(bottles, perfumes), {
    longevity: null,
    gender: null,
  });
  assert.deepEqual(computeDnaDimensionDominants([], perfumes), { longevity: null, gender: null });
});

test('Fase N10 — dominantFamilyShare: highest share wins; zero-only returns null', () => {
  assert.deepEqual(
    dominantFamilyShare([
      { family: 'Woody', percentage: 20 },
      { family: 'Floral', percentage: 50 },
      { family: 'Fresh', percentage: 30 },
    ]),
    { family: 'Floral', percentage: 50 }
  );
  assert.equal(dominantFamilyShare([]), null);
  assert.equal(
    dominantFamilyShare([
      { family: 'Woody', percentage: 0 },
      { family: 'Floral', percentage: 0 },
    ]),
    null
  );
});

test('Fase N10 — J-04 findTopTie: equal top scores are a tie; unique top is not', () => {
  const tied = [
    { matchScore: 77, perfume: 'A' },
    { matchScore: 77, perfume: 'B' },
    { matchScore: 60, perfume: 'C' },
  ];
  const found = findTopTie(tied);
  assert.equal(found?.score, 77);
  assert.equal((found?.first as { perfume: string }).perfume, 'A');
  assert.equal((found?.second as { perfume: string }).perfume, 'B');
  // Unique top: no tie even when lower ranks tie.
  assert.equal(findTopTie([
    { matchScore: 80 },
    { matchScore: 77 },
    { matchScore: 77 },
  ]), null);
  assert.equal(findTopTie([{ matchScore: 77 }]), null);
  assert.equal(findTopTie([]), null);
});

// ── Source-level guards: the N10 UI hooks exist where the live probe
// cannot reach them as a guest (Admin needs a signed-in admin) or where a
// one-line wiring mistake would silently drop the feature. ─────────────
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readSrc = (rel: string) => readFileSync(path.join(__dirname, rel), 'utf-8');

test('Fase N10 — Admin W-52: six section headings are h2, none left as h3', () => {
  const src = readSrc('../components/AdminDashboardView.tsx');
  for (const key of ['funnelTitle', 'clicksTitle', 'catalogTitle', 'reviewsTitle', 'waitlistTitle', 'flagsTitle']) {
    assert.ok(src.includes(`<h2 className="font-display text-`), `h2 for ${key}`);
    assert.ok(!src.includes(`<h3 className="font-display text-`) || !src.includes(`admin.${key}</h3>`), `no h3 for ${key}`);
  }
  const h2Count = (src.match(/<h2 className="font-display text-(xl|2xl) font-bold">\{translations\[locale\]\.admin\.(funnelTitle|clicksTitle|catalogTitle|reviewsTitle|waitlistTitle|flagsTitle)\}<\/h2>/g) || []).length;
  assert.equal(h2Count, 6);
});

test('Fase N10 — Admin W-20: delete opens a confirm dialog; no direct delete remains', () => {
  const src = readSrc('../components/AdminDashboardView.tsx');
  assert.ok(src.includes("import { BottomSheetOrModal } from './BottomSheetOrModal.tsx'"));
  assert.ok(src.includes('const [pendingDelete, setPendingDelete] = useState'));
  assert.ok(src.includes('setPendingDelete({ kind: \'perfume\''));
  assert.ok(src.includes('setPendingDelete({'));
  assert.ok(src.includes('data-testid="admin-confirm-delete"'));
  // P1 Admin v1 (28 Nov 2026): handler konfirmasi hapus parfum menjadi
  // async — onDeletePerfume di-await (soft-delete server) dan gagalnya
  // menampilkan pesan + keadaan dipulihkan. Perilaku yang dikunci tes
  // ini TIDAK berubah: hapus HANYA lewat dialog konfirmasi, tidak ada
  // hapus langsung dari baris tabel.
  assert.ok(src.includes("if (pendingDelete.kind === 'perfume') {"), 'confirm handler branches on perfume');
  assert.ok(src.includes('await onDeletePerfume(id);'), 'confirm dialog awaits the server delete');
  assert.ok(src.includes('onDeleteReview(pendingDelete.id);'), 'review delete still goes through confirm');
  assert.ok(!src.includes('onClick={() => onDeletePerfume(p.id)}'), 'perfume delete is gated');
  assert.ok(!src.includes('onClick={() => onDeleteReview(r.id)}'), 'review delete is gated');
});

test('Fase N10 — Legal W-93: HAPUS DATA label is bound to its input', () => {
  const src = readSrc('../components/LegalModal.tsx');
  assert.ok(src.includes('<label htmlFor="legal-delete-confirm"'));
  assert.ok(src.includes('id="legal-delete-confirm"'));
});

test('Fase N10 — Legal C-04/C-05: per-tab updated date + Privacy cookie section 6', () => {
  const src = readSrc('../components/LegalPage.tsx');
  assert.ok(src.includes('data-testid="legal-last-updated"'));
  assert.ok(src.includes("tab === 'privacy' ? t.updatedPrivacyDate : t.updatedLegacyDate"));
  assert.ok(src.includes('{ heading: t.privacyS6H, body: t.privacyS6B }'));
});

test('Fase N10 — Library BR-02: no average remaining % in the Wardrobe Summary Card', () => {
  const src = readSrc('../components/LibraryView.tsx');
  assert.ok(!src.includes('rataRataSisaIsiBotol'), 'summary row removed');
  assert.ok(!src.includes('averageRemainingPct}%'), 'no % rendering in LibraryView');
});

test('Fase N10 — Compare J-10/W-38: singular "1 note sama" when exactly one shared note', () => {
  const src = readSrc('../components/CompareView.tsx');
  assert.ok(src.includes('sharedNotes.size === 1 ? translations[locale].compareView.sharedNoteSingular : translations[locale].compareView.sharedNotePlural'));
  assert.ok(!src.includes('notesSamaTerdeteksi'), 'old plural-only string gone');
});

test('Fase N10 — Journal B1: today section + archive section split', () => {
  const src = readSrc('../components/ScentDiaryView.tsx');
  assert.ok(src.includes('t.diaryView.todayHeading'));
  assert.ok(src.includes('t.diaryView.archiveHeading'));
  assert.ok(src.includes('renderWearGroup(todayGroup, true)'));
  assert.ok(src.includes('archiveGroups.map(g => renderWearGroup(g, false))'));
  assert.ok(src.includes('key: string;'), 'DateGroup carries the ISO key');
});

test('Fase N10 — Finder J-04: tie note renders from displayed results', () => {
  const src = readSrc('../components/ScentFinderView.tsx');
  assert.ok(src.includes('findTopTie(displayResults)'));
  assert.ok(src.includes('data-testid="finder-tie-note"'));
  assert.ok(src.includes('translations[locale].finderView.tieNote'));
});

test('Fase N10 — DNA J-02/P15: gate names the custom bottle as third path; no Home widget', () => {
  const src = readSrc('../components/ProfileExtrasView.tsx');
  assert.ok(src.includes('perfumesCount < 3'), 'gate threshold kept at 3');
  assert.ok(src.includes('t.scentDnaView.gateBodyCustom'));
  const appSrc = readSrc('../App.tsx');
  // Modul helper (countProfilePerfumes, extractRankedTopNotes) masih
  // diimpor dari file itu — yang hilang adalah KOMPONEN widgetnya.
  assert.ok(!appSrc.includes('<ScentDnaVisualisation'), 'DNA widget not rendered in App');
  assert.ok(!appSrc.includes('ScentDnaVisualisation,'), 'DNA component not imported in App');
});

test('Fase N10 — Log Wear toast is the plan-literal "Tercatat hari ini"', () => {
  const appSrc = readSrc('../App.tsx');
  assert.ok(!appSrc.includes('t.toast.loggedWear.replace'), 'no stale placeholder replaces');
});
