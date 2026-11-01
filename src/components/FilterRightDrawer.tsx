import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { usePrefersReducedMotion } from '../lib/motion.ts';
import { translations, type Locale } from '../lib/i18n.ts';

interface FilterRightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: Locale;
  title?: React.ReactNode;
  /** Search field rendered in the sticky header block, so it never scrolls away. */
  search?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  ariaLabel?: string;
}

/**
 * FilterRightDrawer — full-height drawer docked to the RIGHT edge, used
 * ONLY by the Catalog filter popups (Asal Brand, Specific Brand, Year of
 * Release). Founder corrections on PR #35 (1 Nov 2026) and the PR #36
 * follow-up (1 Nov 2026): the Zalora-style popup must be a full side
 * panel, not a floating centred modal — and it must cover the WHOLE
 * viewport, with the main page frozen behind it and only the panel
 * itself scrolling.
 *
 * Why this component is rendered through a PORTAL (not inline):
 * App.tsx wraps every view in a container with `animate-screen-enter`,
 * whose keyframes end in `transform: translateY(0)` with `forwards`
 * fill mode. A transformed ancestor becomes the containing block for
 * `position: fixed` descendants, so a fixed drawer rendered inside
 * CatalogView was trapped inside the Catalog area and could never
 * cover the site header, navigation, or the "Kamu belum masuk" banner
 * (that is exactly what the PR #36 preview showed). Rendering into
 * `document.body` via createPortal makes `fixed inset-0` relative to
 * the real viewport again. The wrapper also uses z-[100], above the
 * site chrome (sticky top bar / banner at z-50) and above the centred
 * BottomSheetOrModal (z-50), so the panel sits on top of everything.
 *
 * Layout (documented in the PR body): desktop panel 440px wide (inside
 * the 400–480px range); on narrow screens the drawer is full-width so
 * the option list stays readable. Height is 100dvh, top to bottom.
 *
 * Scroll contract (founder, 1 Nov 2026): while the drawer is open the
 * main page is FROZEN — it cannot be scrolled by wheel, touch, or
 * keyboard — and only the drawer body scrolls. This is enforced by:
 *   1. `overflow: hidden` on BOTH documentElement and body (restored
 *      exactly on close/unmount, including during the 200ms exit
 *      animation — the lock is held until the portal unmounts);
 *   2. non-passive `wheel`/`touchmove` listeners on document that
 *      preventDefault any scroll gesture whose target is OUTSIDE the
 *      drawer panel (gestures inside the panel scroll it normally);
 *   3. a focus trap, so keyboard scrolling (arrows / space / PageUp /
 *      PageDown) stays inside the panel instead of moving the page.
 * Header (title + X + search) and footer (Hapus/Tambah) are FIXED
 * rows of a grid layout (see below), outside the scrollable body, so
 * BOTH stay visible while only the option list scrolls.
 *
 * Why GRID, not the previous flex column: PR #36 shipped the drawer
 * as `flex flex-col` with a shrink-0 header, a flex-1 overflow-y-auto
 * body, and a shrink-0 footer — which in theory should have held the
 * header in place. The production live-browser check of PR #36 (1 Nov
 * 2026) nevertheless observed the header (title + X + search) leaving
 * the top of the panel when the Year of Release list was scrolled to
 * the bottom, while the footer stayed visible. The flex scroll region
 * therefore cannot be trusted here as the sole mechanism. The panel
 * is now `grid grid-rows-[auto_minmax(0,1fr)_auto]`: the header and
 * footer are fixed-size rows that structurally cannot scroll away,
 * and the middle row is bounded by minmax(0,1fr) with min-h-0, so it
 * is the ONLY region that can scroll. As a second line of defence,
 * the header is also `sticky top-0` and the footer `sticky bottom-0`,
 * so even if some ancestor ever became the scroll container, both
 * would still stick to the panel edges.
 *
 * Behaviour mirrors BottomSheetOrModal's controlled close contract:
 * the parent owns `isOpen`; close requests (X / Escape / backdrop)
 * ONLY call `onClose`, and the parent discards the draft on close.
 * Deliberately a separate component (not a BottomSheetOrModal variant)
 * so the centred sheet/modal used by Buy, Compare and Library is
 * untouched by this change.
 */
export const FilterRightDrawer: React.FC<FilterRightDrawerProps> = ({
  isOpen,
  onClose,
  locale = 'id',
  title,
  search,
  children,
  footer,
  ariaLabel = 'Panel filter'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      setIsRendered(true);
      setIsClosing(false);
      return;
    }
    if (!isRendered) return;
    if (prefersReducedMotion) {
      setIsRendered(false);
      setIsClosing(false);
      return;
    }
    setIsClosing(true);
    exitTimerRef.current = setTimeout(() => {
      setIsRendered(false);
      setIsClosing(false);
      exitTimerRef.current = null;
    }, 200);
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [isOpen, isRendered, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  const handleRequestClose = useCallback(() => {
    onCloseRef.current();
  }, []);

  // Esc key + Tab focus trap + REAL body scroll lock.
  // NOTE: this effect keys on isRendered only (not isClosing), so the
  // lock is held through the 200ms exit animation and is only released
  // when the portal actually unmounts.
  useEffect(() => {
    if (!isRendered) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleRequestClose();
        return;
      }
      if (e.key !== 'Tab' || !containerRef.current) return;
      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Freeze the page: lock BOTH html and body overflow. (Locking body
    // alone is not enough on browsers that scroll the root element.)
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Belt-and-braces for wheel/touch: block scroll gestures that start
    // outside the drawer panel. Gestures inside the panel are untouched,
    // so the option list still scrolls. Listeners must be non-passive
    // for preventDefault to work.
    const blockOutsideScroll = (e: Event) => {
      const target = e.target as Node | null;
      if (containerRef.current && target && containerRef.current.contains(target)) return;
      e.preventDefault();
    };
    document.addEventListener('wheel', blockOutsideScroll, { passive: false });
    document.addEventListener('touchmove', blockOutsideScroll, { passive: false });

    window.addEventListener('keydown', handleKeyDown);

    const timer = setTimeout(() => {
      if (containerRef.current) {
        const focusable = containerRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', blockOutsideScroll);
      document.removeEventListener('touchmove', blockOutsideScroll);
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      clearTimeout(timer);
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isRendered, handleRequestClose]);

  if (!isRendered) return null;

  // PORTAL: renders into document.body so `fixed inset-0` is relative
  // to the viewport, not to the transformed view container in App.tsx.
  // z-[100] sits above the site chrome (z-50) and BottomSheetOrModal.
  return createPortal(
    <div
      className={`fixed inset-0 top-0 right-0 z-[100] bg-ink/40 flex justify-end overflow-hidden transition-opacity duration-200 ease-out ${
        isClosing ? 'opacity-0' : 'animate-backdrop-enter'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : ariaLabel}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleRequestClose();
        }
      }}
    >
      <div
        ref={containerRef}
        className={`h-dvh w-full sm:w-[440px] max-w-full ml-auto bg-paper border-l border-bar shadow-sheet grid grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden transition-transform duration-200 ease-out ${
          isClosing ? 'translate-x-full' : 'animate-drawer-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed header row: title + close, then search — a grid row,
            not a flex child, so it can never scroll away with the
            list. Sticky top-0 is a second line of defence, and the
            explicit bg-paper keeps list content from showing through
            if this row ever overlays scrolling content. */}
        <div className="sticky top-0 z-10 bg-paper border-b border-hairline">
          <div className="flex items-start justify-between px-5 pt-4 pb-3">
            <div className="space-y-0.5 pr-4">
              {title && (
                <div className="font-serif text-xl sm:text-2xl font-normal text-ink leading-tight">
                  {title}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleRequestClose}
              className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 p-2 text-secondary hover:text-ink flex items-center justify-center transition active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ink cursor-pointer"
              aria-label={translations[locale].common.closeDialog}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {search && (
            <div className="px-5 pb-4">{search}</div>
          )}
        </div>

        {/* Scrollable body: ONLY this region scrolls. min-h-0 is
            essential: without it the grid row can grow to fit its
            content instead of constraining to the panel height, which
            would push the scroll region out to the panel itself. */}
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
          {children}
        </div>

        {/* Fixed footer row: Hapus / Tambah stay visible while
            scrolling. Sticky bottom-0 is a second line of defence. */}
        {footer && (
          <div className="sticky bottom-0 z-10 px-5 py-4 border-t border-hairline bg-paper pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
