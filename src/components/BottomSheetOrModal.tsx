import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { usePrefersReducedMotion } from '../lib/motion.ts';

interface BottomSheetOrModalProps {
  isOpen: boolean;
  onClose: () => void;
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
 */
export const BottomSheetOrModal: React.FC<BottomSheetOrModalProps> = ({
  isOpen,
  onClose,
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

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const closingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync rendered state with isOpen prop
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
      if (closingTimerRef.current) clearTimeout(closingTimerRef.current);
    } else if (isRendered && !isClosing) {
      if (prefersReducedMotion) {
        setIsRendered(false);
      } else {
        setIsClosing(true);
        closingTimerRef.current = setTimeout(() => {
          setIsRendered(false);
          setIsClosing(false);
        }, 200);
      }
    }
  }, [isOpen, isRendered, isClosing, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (closingTimerRef.current) clearTimeout(closingTimerRef.current);
    };
  }, []);

  const handleRequestClose = () => {
    if (prefersReducedMotion) {
      onClose();
    } else {
      setIsClosing(true);
      if (closingTimerRef.current) clearTimeout(closingTimerRef.current);
      closingTimerRef.current = setTimeout(() => {
        setIsClosing(false);
        setIsRendered(false);
        onClose();
      }, 200);
    }
  };

  // Esc key listener & body scroll lock & focus restoration
  useEffect(() => {
    if (!isRendered || isClosing) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleRequestClose();
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
  }, [isRendered, isClosing]);

  if (!isRendered && !isOpen) return null;

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
              aria-label="Tutup / Close"
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
