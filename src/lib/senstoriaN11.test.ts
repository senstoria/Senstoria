// Fase N11 — Motion + aksesibilitas sistemik (toast 2.200 ms, press 0,97).
// Unit tests for the pure helpers + source-level guards for the wiring
// that only exists in component code (same pattern as senstoriaN10.test.ts).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DRAG_DISMISS_VELOCITY_PX_PER_MS,
  MOTION_TOKENS,
  SHEET_EXIT_MS,
  TOAST_DURATION_MS,
  TOAST_EXIT_MS,
  hapticTick,
  rubberBandOffset,
  shouldDismissDrag,
} from './motion.ts';
import { detectLocale, resolveInitialLocale } from './detectLocale.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readSrc = (rel: string) => readFileSync(path.join(__dirname, rel), 'utf-8');

// ── Token values (keputusan founder 28 Nov 2026, jangan diubah diam-diam) ──
test('Fase N11 — token: press 0,97 + toast 2.200 ms + exit 170 ms', () => {
  assert.equal(MOTION_TOKENS.press, 0.97);
  assert.equal(TOAST_DURATION_MS, 2200);
  assert.equal(TOAST_EXIT_MS, 170);
  assert.equal(SHEET_EXIT_MS, 170);
  assert.equal(MOTION_TOKENS.duration.base, 0.24);
  assert.equal(MOTION_TOKENS.duration.fast, 0.14);
  assert.equal(MOTION_TOKENS.duration.page, 0.34);
  assert.equal(DRAG_DISMISS_VELOCITY_PX_PER_MS, 0.45);
});

// ── detectLocale (W-19) ──
test('Fase N11 — detectLocale: en* → en, lainnya → id (fallback aman)', () => {
  assert.equal(detectLocale('en-US'), 'en');
  assert.equal(detectLocale('en-GB'), 'en');
  assert.equal(detectLocale('EN-us'), 'en');
  assert.equal(detectLocale('en'), 'en');
  assert.equal(detectLocale('id-ID'), 'id');
  assert.equal(detectLocale('id'), 'id');
  assert.equal(detectLocale('de-DE'), 'id');
  assert.equal(detectLocale(''), 'id');
  assert.equal(detectLocale(undefined), 'id');
  assert.equal(detectLocale('  en  '), 'en');
});

test('Fase N11 — resolveInitialLocale: locale tersimpan selalu menang atas deteksi', () => {
  assert.equal(resolveInitialLocale('en', 'id-ID'), 'en');
  assert.equal(resolveInitialLocale('id', 'en-US'), 'id');
  assert.equal(resolveInitialLocale(null, 'en-US'), 'en');
  assert.equal(resolveInitialLocale(null, 'id-ID'), 'id');
  assert.equal(resolveInitialLocale(null, undefined), 'id');
  assert.equal(resolveInitialLocale('xx', 'en-US'), 'en');
  assert.equal(resolveInitialLocale('EN', 'id-ID'), 'id'); // stored case-sensitive: hanya 'en'/'id' persis yang menang
});

// ── Drag math (sheet/toast dismiss) ──
test('Fase N11 — rubberBandOffset: ke arah tutup 1:1, melawan arah dilawan 0,3×', () => {
  assert.equal(rubberBandOffset(0), 0);
  assert.equal(rubberBandOffset(100), 100);
  assert.equal(rubberBandOffset(200), 200);
  assert.equal(rubberBandOffset(-10), -3);
  assert.equal(rubberBandOffset(-100), -30);
});

test('Fase N11 — shouldDismissDrag: jarak >30% ukuran ATAU kecepatan >0,45 px/ms', () => {
  assert.equal(shouldDismissDrag(80, 200, 0.1), true); // 80 > 60 (30% dari 200)
  assert.equal(shouldDismissDrag(59, 200, 0.1), false);
  assert.equal(shouldDismissDrag(60, 200, 0.1), false); // tepat di ambang: tidak
  assert.equal(shouldDismissDrag(61, 200, 0.1), true);
  assert.equal(shouldDismissDrag(10, 200, 0.5), true); // kecepatan lolos
  assert.equal(shouldDismissDrag(10, 200, 0.1), false);
  assert.equal(shouldDismissDrag(0, 0, 0), false);
  assert.equal(shouldDismissDrag(90, 0, 0.1), true); // size 0 → ambang darurat 80
  assert.equal(shouldDismissDrag(80, 0, 0.1), false);
});

test('Fase N11 — hapticTick: tidak throw tanpa navigator (Node/SSR)', () => {
  assert.doesNotThrow(() => hapticTick());
});

// ── Source-level guards ──
test('Fase N11 — drag tidak dimulai dari tombol (pointer capture mematikan klik)', () => {
  // Regresi dari probe: setPointerCapture di handle mengalihkan klik ke
  // handle, sehingga tombol Tutup toast + tombol X drawer desktop mati.
  // Guard harus ada di hook drag DAN di handler toast.
  const motion = readSrc('./motion.ts');
  assert.ok(motion.includes("closest?.('button, a, input, select, textarea, [role=\"button\"]')"));
  const app = readSrc('../App.tsx');
  assert.ok(app.includes("closest?.('button, a, input, select, textarea, [role=\"button\"]')"));
});

test('Fase N11 — motion.ts: objek transitions mati dihapus; tidak ada sisa', () => {
  const src = readSrc('./motion.ts');
  assert.ok(!src.includes('export const transitions'), 'transitions masih ada');
  assert.ok(!src.includes("from 'framer-motion'"), 'impor framer-motion masih ada');
  assert.ok(!src.includes('export const transitions ='), 'transitions masih ada');
  assert.ok(src.includes('TOAST_DURATION_MS'), 'konstanta toast hilang');
  assert.ok(src.includes('useDragToDismiss'), 'hook drag hilang');
});

test('Fase N11 — App: toast 2.200 ms + role=status + tutup + hover-pause + swipe', () => {
  const src = readSrc('../App.tsx');
  assert.ok(!src.includes('}, 8000)'), 'timer toast 8.000 ms masih ada');
  assert.ok(src.includes('startToastTimer(TOAST_DURATION_MS)'));
  assert.ok(src.includes('role="status"'));
  assert.ok(src.includes('aria-live="polite"'));
  assert.ok(src.includes('aria-label={translations[locale].common.closeDialog}'));
  assert.ok(src.includes('onMouseEnter={pauseToast}'));
  assert.ok(src.includes('onMouseLeave={resumeToast}'));
  assert.ok(src.includes('onPointerDown={handleToastPointerDown}'));
  assert.ok(src.includes('onPointerMove={handleToastPointerMove}'));
  assert.ok(src.includes('onPointerUp={handleToastPointerUp}'));
  assert.ok(src.includes("animate-toast-exit"));
  // I-05: toast naik di atas tray saat tray terbuka.
  assert.ok(src.includes('bottom-[calc(168px+env(safe-area-inset-bottom,0px))]'));
});

test('Fase N11 — App: transisi arah via View Transitions + fallback kelas', () => {
  const src = readSrc('../App.tsx');
  assert.ok(src.includes('setViewRaw'), 'setter mentah hilang');
  assert.ok(src.includes('startViewTransition'), 'View Transitions API tidak dipakai');
  assert.ok(src.includes('VIEW_DEPTH'), 'peta kedalaman layar hilang');
  assert.ok(src.includes('animate-screen-enter-${navDirection}'));
  assert.ok(src.includes('dataset.navDirection = dir'), 'arah tidak ditulis ke <html>');
  assert.ok(!src.includes('className="animate-screen-enter space-y-8"'), 'enter seragam lama masih ada');
});

test('Fase N11 — App: locale awal dari navigator.language (W-19)', () => {
  const src = readSrc('../App.tsx');
  assert.ok(src.includes('resolveInitialLocale('));
  assert.ok(src.includes('navigator.language'));
});

test('Fase N11 — App: undo hapus admin benar-benar memulihkan (bukan janji)', () => {
  const src = readSrc('../App.tsx');
  // Katalog: undo mengembalikan baris + localStorage.
  assert.ok(src.includes('setAdminCatalogPerfumes(prev);'));
  // Review: hapus Firestore ditunda sampai toast habis.
  assert.ok(src.includes('pendingReviewDeleteRef'));
  assert.ok(src.includes('setTimeout(() => {'));
  assert.ok(src.includes('}, TOAST_DURATION_MS);'));
});

test('Fase N11 — App: haptics di tiga titik commit (semprot, simpan, kirim)', () => {
  const src = readSrc('../App.tsx');
  assert.ok(src.includes('hapticTick,'), 'hapticTick tidak diimpor');
  assert.ok(src.includes('hapticTick'));
  const calls = (src.match(/hapticTick\(\);/g) ?? []).length;
  assert.ok(calls >= 3, `hanya ${calls} situs hapticTick()`);
});

test('Fase N11 — App: tidak ada lagi transition-all', () => {
  const src = readSrc('../App.tsx');
  assert.ok(!src.includes('transition-all'), 'transition-all masih ada di App.tsx');
});

test('Fase N11 — main.tsx: touchstart pasif supaya :active jalan di iOS Safari', () => {
  const src = readSrc('../main.tsx');
  assert.ok(src.includes("addEventListener('touchstart'"));
  assert.ok(src.includes('passive: true'));
});

test('Fase N11 — BottomSheetOrModal: drag-to-dismiss + exit 170 ms + fade reduced-motion', () => {
  const src = readSrc('../components/BottomSheetOrModal.tsx');
  assert.ok(src.includes('useDragToDismiss'));
  assert.ok(src.includes('SHEET_EXIT_MS'));
  assert.ok(src.includes('animate-rm-fade-out'));
  assert.ok(!src.includes('duration-200'), 'exit sheet 200 ms lama masih ada');
});

test('Fase N11 — FilterRightDrawer: drag-to-close + exit 170 ms', () => {
  const src = readSrc('../components/FilterRightDrawer.tsx');
  assert.ok(src.includes('useDragToDismiss'));
  assert.ok(src.includes('SHEET_EXIT_MS'));
});

test('Fase N11 — LegalModal: animasi dialog masuk/keluar (bukan muncul instan)', () => {
  const src = readSrc('../components/LegalModal.tsx');
  assert.ok(src.includes('animate-dialog-enter'));
  assert.ok(src.includes('animate-dialog-exit'));
  assert.ok(src.includes('TOAST_EXIT_MS'));
});

test('Fase N11 — 10 tombol ikon diberi nama (aria-label), bukan title saja', () => {
  const finder = readSrc('../components/ScentFinderView.tsx');
  assert.ok(finder.includes('aria-label={isWish ? translations[locale].libraryView.hapusDariWishlist'));
  assert.ok(finder.includes('aria-label={isComp ? fmt(translations[locale].compareTray.removeAria, p.name)'));
  assert.ok(finder.includes('aria-pressed={isWish}'));
  assert.ok(finder.includes('aria-pressed={isComp}'));
  const compare = readSrc('../components/CompareView.tsx');
  assert.ok(compare.includes('aria-label={fmt(translations[locale].compareTray.removeAria, p.name)}'));
  const admin = readSrc('../components/AdminDashboardView.tsx');
  assert.ok(admin.includes('aria-label={translations[locale].admin.editPerfumeTitle}'));
  assert.ok(admin.includes('aria-label={translations[locale].admin.deletePerfumeTitle}'));
  assert.ok(admin.includes('aria-label={translations[locale].admin.deletePermanentTitle}'));
  const diary = readSrc('../components/ScentDiaryView.tsx');
  assert.ok(diary.includes('aria-label={translations[locale].diaryView.deleteLogTitle}'));
  assert.ok(diary.includes('aria-label={translations[locale].diaryView.deleteStoryTitle}'));
});

test('Fase N11 — CompareView: quick-add search punya label programatik', () => {
  const src = readSrc('../components/CompareView.tsx');
  assert.ok(src.includes('aria-label={translations[locale].compareView.cariNamaAtauBrandParfum}'));
});

test('Fase N11 — Auth: submitting state + error role=alert (W-47/W-48)', () => {
  const src = readSrc('../components/AuthPageView.tsx');
  assert.ok(src.includes('role="alert"'));
  assert.ok(src.includes('aria-busy={submitting}'));
  assert.ok(src.includes('t.submitting'));
  assert.ok(src.includes('disabled={submitting ||'));
});

test('Fase N11 — i18n: kunci authModal.submitting ada di tipe + ID + EN', () => {
  const src = readSrc('./i18n.ts');
  assert.ok(src.includes('submitting: string;'));
  assert.ok(src.includes("submitting: 'Memproses…',"));
  assert.ok(src.includes("submitting: 'Processing…',"));
});

test('Fase N11 — Share modal lewat BottomSheetOrModal (N-01/N-07)', () => {
  const src = readSrc('../components/ProductDetailView.tsx');
  const shareIdx = src.indexOf('SHARE MODAL');
  assert.ok(shareIdx > 0);
  const shareBlock = src.slice(shareIdx, shareIdx + 800);
  assert.ok(shareBlock.includes('<BottomSheetOrModal'), 'Share masih modal custom');
  assert.ok(!shareBlock.includes('fixed inset-0'), 'Share masih div fixed custom');
});

test('Fase N11 — index.css: token 140 ms jadi default + FEEL + reduced-motion fade', () => {
  const src = readSrc('../index.css');
  assert.ok(src.includes('--default-transition-duration: 140ms'));
  assert.ok(!src.includes('cubic-bezier(0, 0, 0.2, 1)'), 'kurva lama masih ada');
  assert.ok(src.includes('animate-toast-exit'));
  assert.ok(src.includes('animate-dialog-enter'));
  assert.ok(src.includes('rmFadeIn'));
  assert.ok(src.includes('data-nav-direction'));
  assert.ok(src.includes('.btn-press'));
});

test('Fase N11 — tidak ada lagi transition-all + width di 7 file yang disentuh', () => {
  const files = [
    '../components/CompareTray.tsx',
    '../components/AdminDashboardView.tsx',
    '../components/ScentDnaVisualisation.tsx',
    '../components/ScentFinderView.tsx',
    '../components/CatalogView.tsx',
    '../components/NotificationsView.tsx',
    '../components/OnboardingProgressBar.tsx',
  ];
  for (const f of files) {
    const src = readSrc(f);
    assert.ok(!src.includes('transition-all'), `transition-all masih ada di ${f}`);
  }
  // Bar yang dulu dianimasikan via width kini scaleX.
  assert.ok(readSrc('../components/AdminDashboardView.tsx').includes('scaleX(${step.pct / 100})'));
  assert.ok(readSrc('../components/ScentFinderView.tsx').includes('scaleX(${progressPct / 100})'));
  assert.ok(readSrc('../components/OnboardingProgressBar.tsx').includes('scaleX(${Math.min(1, Math.max(0, step / total))})'));
});

test('Fase N11 — toggle pop: ikon wishlist/favorit beranimasi saat aktif', () => {
  assert.ok(readSrc('../components/CatalogView.tsx').includes('toggle-icon-on'));
  assert.ok(readSrc('../components/LibraryView.tsx').includes('toggle-icon-on'));
  assert.ok(readSrc('../components/ScentFinderView.tsx').includes('toggle-icon-on'));
  const css = readSrc('../index.css');
  assert.ok(css.includes('@keyframes togglePop'));
});
