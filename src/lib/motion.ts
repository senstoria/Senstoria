import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Standard motion tokens for Senstoria — token `soft` (§5 spesifikasi
 * Tahap 2, 26 Nov 2026; menggantikan Rule 10 150–200ms).
 * press 140ms, sheet/dialog/menu 240ms, perpindahan halaman 340ms,
 * toast 240ms, angka yang berubah 200ms (tabular-nums). Opacity &
 * transform saja, tanpa bounce/overshoot. Respects
 * prefers-reduced-motion.
 *
 * Fase N11 (28 Nov 2026):
 * - press scale 0.97 — keputusan founder (Apple/Emil), menggantikan
 *   0.98. Satu kedalaman untuk semua tombol (ditegakkan global di
 *   index.css, bukan per tombol).
 * - toast 2.200 ms — keputusan founder (Nike), menggantikan 8.000 ms.
 * - ease-out FEEL cubic-bezier(0.22, 1, 0.36, 1), menggantikan
 *   cubic-bezier(0, 0, 0.2, 1) — lebih lembut di akhir.
 * - exit sheet/drawer 170 ms (slow × 0.5), exit pop/toast/dialog
 *   170 ms (base × 0.7) — menggantikan exit 200 ms.
 * - objek `transitions` framer-motion DIHAPUS (dead code: framer-motion
 *   tidak terinstal; nol import di src/ — motion-spec §1.1).
 */
export const MOTION_TOKENS = {
  duration: {
    instant: 0,
    fast: 0.14, // 140ms — press feedback (token soft)
    base: 0.24, // 240ms — sheet/dialog/menu/toast (token soft)
    page: 0.34, // 340ms — perpindahan halaman, fade + geser (token soft)
    numbers: 0.2, // 200ms — angka yang berubah, tabular-nums (token soft)
    fillBar: 0.4 // 400ms max for bottle level bars
  },
  /** Satu kedalaman tekan untuk semua tombol (keputusan founder N11). */
  press: 0.97,
  /** Durasi tampil toast (keputusan founder N11 — Nike 2.200 ms). */
  toastDurationMs: 2200,
  /** Exit sheet/drawer/backdrop (slow × 0.5). */
  exitSheetMs: 170,
  /** Exit dialog/toast/pop (base × 0.7). */
  exitPopMs: 170,
  /** Kembalinya sheet/drawer yang dilempar tapi tidak jadi ditutup. */
  snapBackMs: 350,
  ease: [0.22, 1, 0.36, 1] as const, // cubic-bezier ease-out (FEEL)
  cssEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
  /** Ease-in — hanya untuk kepergian (exit), bukan respons tap. */
  cssEaseIn: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Ease untuk fade polos & seluruh reduced-motion. */
  cssEaseFade: 'cubic-bezier(0, 0, 0.58, 1)'
};

/** Durasi tampil toast — satu sumber (dipakai App.tsx + tes + probe). */
export const TOAST_DURATION_MS = MOTION_TOKENS.toastDurationMs;
/** Durasi exit toast/dialog — satu sumber. */
export const TOAST_EXIT_MS = MOTION_TOKENS.exitPopMs;
/** Durasi exit sheet/drawer — satu sumber. */
export const SHEET_EXIT_MS = MOTION_TOKENS.exitSheetMs;

/**
 * Hook to detect if the user has requested reduced motion.
 * Returns true if prefers-reduced-motion: reduce is enabled.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    } else {
      // Legacy fallback
      mediaQuery.addListener(onChange);
      return () => mediaQuery.removeListener(onChange);
    }
  }, []);

  return prefersReduced;
}

/**
 * Haptic ringan — hanya pada commit (catat semprot, simpan, kirim),
 * sekali, ringan. iOS Safari web tidak mengekspos vibrate, jadi ini
 * no-op diam di sana (bukan error, bukan janji palsu).
 */
export function hapticTick(): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  } catch {
    // vibrate tidak tersedia — abaikan diam-diam.
  }
}

/**
 * Rubber-band: tarikan melawan arah tutup dilawan (0.3×), tarikan ke
 * arah tutup mengikuti jari 1:1. Pure — bisa dites tanpa DOM.
 */
export function rubberBandOffset(delta: number): number {
  return delta <= 0 ? delta * 0.3 : delta;
}

/** Ambang lepas: >30% ukuran panel, atau kecepatan >450 px/detik. */
export const DRAG_DISMISS_VELOCITY_PX_PER_MS = 0.45;

/**
 * Apakah drag ini menutup panel/toast? Pure — bisa dites tanpa DOM.
 * `size` 0 (panel belum terukur) memakai ambang darurat 80 px.
 */
export function shouldDismissDrag(offset: number, size: number, velocityPxPerMs: number): boolean {
  const threshold = size > 0 ? size * 0.3 : 80;
  return offset > threshold || velocityPxPerMs > DRAG_DISMISS_VELOCITY_PX_PER_MS;
}

export interface DragToDismiss {
  /** Offset saat ini sepanjang sumbu tutup (px; 0 = posisi istirahat). */
  offset: number;
  /** Pointer sedang menahan panel. */
  dragging: boolean;
  /** Dilepas tanpa menutup — sedang kembali ke posisi istirahat. */
  snapBack: boolean;
  handlePointerDown: (e: React.PointerEvent) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
  handlePointerUp: (e: React.PointerEvent) => void;
  handlePointerCancel: (e: React.PointerEvent) => void;
  /** Makan klik yang mengakhiri sebuah drag (bukan tap). */
  handleClickCapture: (e: React.MouseEvent) => void;
}

/**
 * Drag-to-dismiss untuk sheet/drawer (Fase N11, motion-spec §3.5):
 * ikuti jari 1:1, rubber-band melewati batas, lepas bila >30% ukuran
 * atau kecepatan >450 px/detik, kembali bila tidak. Tanpa dependensi
 * baru — pointer events bawaan browser.
 *
 * `axis`: 'y' = sheet bawah (tutup ke bawah), 'x' = drawer kanan
 * (tutup ke kanan). `size()` dibaca saat lepas (tinggi/lebar panel).
 */
export function useDragToDismiss(opts: {
  axis: 'y' | 'x';
  size: () => number;
  onDismiss: () => void;
  enabled?: boolean;
}): DragToDismiss {
  const { axis, size, onDismiss } = opts;
  const enabled = opts.enabled !== false;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [snapBack, setSnapBack] = useState(false);
  const startRef = useRef<{ pos: number; time: number; lastPos: number; lastTime: number } | null>(null);
  const movedRef = useRef(false);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled || !e.isPrimary) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Fase N11 (koreksi probe): jangan mulai drag dari elemen interaktif
    // (mis. tombol X di title row drawer desktop). setPointerCapture di
    // bawah akan mengalihkan klik ke handle, sehingga onClick tombol
    // tidak pernah jalan — tombol tutup jadi mati.
    const target = e.target as HTMLElement | null;
    if (target?.closest?.('button, a, input, select, textarea, [role="button"]')) return;
    if (snapTimerRef.current) {
      clearTimeout(snapTimerRef.current);
      snapTimerRef.current = null;
    }
    setSnapBack(false);
    movedRef.current = false;
    const pos = axis === 'y' ? e.clientY : e.clientX;
    startRef.current = { pos, time: performance.now(), lastPos: pos, lastTime: performance.now() };
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // setPointerCapture tidak didukung — gerakan tetap dilacak via move.
    }
  }, [axis, enabled]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const start = startRef.current;
    if (!enabled || !start || !e.isPrimary) return;
    const pos = axis === 'y' ? e.clientY : e.clientX;
    const now = performance.now();
    const delta = pos - start.pos;
    if (Math.abs(delta) > 6) movedRef.current = true;
    if (movedRef.current) setDragging(true);
    const velocity = now > start.lastTime ? (pos - start.lastPos) / (now - start.lastTime) : 0;
    start.lastPos = pos;
    start.lastTime = now;
    startRef.current = { ...start, velocity } as typeof start & { velocity: number };
    setOffset(rubberBandOffset(delta));
  }, [axis, enabled]);

  const finishDrag = useCallback((e: React.PointerEvent) => {
    const start = startRef.current;
    startRef.current = null;
    setDragging(false);
    if (!enabled || !start) {
      setOffset(0);
      return;
    }
    const pos = axis === 'y' ? e.clientY : e.clientX;
    const now = performance.now();
    const delta = pos - start.pos;
    const last = (start as { velocity?: number }).velocity ?? 0;
    const overallVelocity = now > start.time ? delta / (now - start.time) : 0;
    const velocity = Math.max(last, overallVelocity);
    const off = rubberBandOffset(delta);
    if (shouldDismissDrag(off, sizeRef.current(), velocity)) {
      setOffset(0);
      onDismissRef.current();
      return;
    }
    // Kembali ke posisi istirahat (spring 350 ms, tanpa overshoot).
    setOffset(0);
    setSnapBack(true);
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    snapTimerRef.current = setTimeout(() => {
      setSnapBack(false);
      snapTimerRef.current = null;
    }, MOTION_TOKENS.snapBackMs);
  }, [axis, enabled]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    finishDrag(e);
  }, [finishDrag]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    finishDrag(e);
  }, [finishDrag]);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (movedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      movedRef.current = false;
    }
  }, []);

  return {
    offset,
    dragging,
    snapBack,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleClickCapture,
  };
}
