import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { usePrefersReducedMotion } from '../lib/motion.ts';
import { translations, type Locale } from '../lib/i18n.ts';

interface FilterRightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: Locale;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  ariaLabel?: string;
}

/**
 * FilterRightDrawer — full-height drawer docked to the RIGHT edge, used
 * ONLY by the Catalog filter popups (Asal Brand, Specific Brand, Year of
 * Release). Founder correction on PR #35 (1 Nov 2026): the Zalora-style
 * popup must be a full side panel, not a floating centred modal.
 *
 * Layout (documented in the PR body): desktop panel 440px wide (inside
 * the 400–480px range); on narrow screens the drawer is full-width so
 * the option list stays readable. Height is 100dvh, top to bottom.
 * Header (title + X) and footer (Hapus/Tambah) are shrink-0, so they
 * stay visible while only the body list scrolls.
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

  // Esc key + Tab focus trap, body scroll lock, focus restore.
  useEffect(() => {
    if (!isRendered || isClosing) return;

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

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

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
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isRendered, isClosing, handleRequestClose]);

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-ink/40 flex justify-end overflow-hidden transition-opacity duration-200 ease-out ${
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
        className={`h-dvh w-full sm:w-[440px] max-w-full ml-auto bg-paper border-l border-bar shadow-sheet flex flex-col overflow-hidden transition-transform duration-200 ease-out ${
          isClosing ? 'translate-x-full' : 'animate-drawer-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header: title + close */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-hairline shrink-0">
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

        {/* Scrollable body: only this region scrolls */}
        <div className="overflow-y-auto px-5 py-4 flex-1 space-y-4">
          {children}
        </div>

        {/* Sticky footer: Hapus / Tambah stay visible while scrolling */}
        {footer && (
          <div className="px-5 py-4 border-t border-hairline shrink-0 bg-paper pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
