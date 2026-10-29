import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { usePrefersReducedMotion } from '../lib/motion.ts';
import { translations, type Locale } from '../lib/i18n.ts';

interface BottomSheetOrModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: Locale;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-lg', 'max-w-md', 'max-w-xl'
  className?: string;
  hideHeader?: boolean;
  ariaLabel?: string;
}

/**
 * Responsive BottomSheetOrModal:
 * - On mobile (< 1024px): slides up as a calm bottom sheet over 200ms ease-out with backdrop fading to 40% black
 * - Closing smoothly reverses the animation over 200ms ease-out before unmounting
 * - Respects prefers-reduced-motion: reduce (skips delay and animations)
 * - Handles backdrop click, Esc key dismiss, body scroll lock, focus trap & restoration
 *
 * Controlled state machine (Sprint 6 fix for the modal-close defect confirmed
 * live 3x: X/Escape did nothing, only reload closed the auth modal). The parent
 * owns `isOpen`; close requests (X / Escape / backdrop) ONLY call `onClose`.
 * The exit animation runs on the `isOpen === false` branch and unmounts after
 * 200ms. The pre-Sprint-6 code ran the close timer from the request handler
 * while a sync effect — re-running on every `isClosing` change while `isOpen`
 * stayed true — reset `isClosing` to false and cleared that timer, so a close
 * could never complete. No effect in this file touches the exit timer except
 * the open branch (cancel) and the close branch (schedule).
 */
export const BottomSheetOrModal: React.FC<BottomSheetOrModalProps> = ({
  isOpen,
  onClose,
  locale = 'id',
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  className = '',
  hideHeader = false,
  ariaLabel = 'Dialog modal'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync rendered state with the controlled isOpen prop.
  useEffect(() => {
    if (isOpen) {
      // Opening (or re-opening mid-exit): render immediately, cancel any
      // pending exit, and never touch a close request's state.
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

  // Close requests only notify the parent; the effect above owns the animation.
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

    // Auto-focus container or first button
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
      className={`fixed inset-0 z-50 bg-ink/40 flex flex-col justify-end lg:justify-center lg:items-center p-0 lg:p-4 overflow-hidden transition-opacity duration-200 ease-out ${
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
        className={`w-full ${maxWidth} bg-paper border-t border-x lg:border border-bar shadow-sheet flex flex-col max-h-[92vh] lg:max-h-[88vh] overflow-hidden transition-transform duration-200 ease-out ${
          isClosing ? 'translate-y-full lg:opacity-0' : 'animate-sheet-enter'
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visible Drag Handle on Mobile (Thumb Ergonomics) */}
        <div className="w-12 h-1 bg-hairline mx-auto my-2.5 shrink-0 lg:hidden cursor-grab" aria-hidden="true" />

        {/* Header with Title and Close Button */}
        {!hideHeader && (
          <div className="flex items-start justify-between px-5 pt-1 pb-3 border-b border-hairline shrink-0">
            <div className="space-y-0.5 pr-4">
              {title && (
                <div className="font-serif text-xl sm:text-2xl font-normal text-ink leading-tight">
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="text-xs text-secondary">
                  {subtitle}
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
        )}

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto px-5 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] lg:pb-6 flex-1 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
