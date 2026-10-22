import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

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
 * - On mobile (< 1024px): slides up as a bottom sheet with drag handle, scroll lock, thumb zone ergonomics
 * - On desktop (>= 1024px): classic centered dialog modal
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

  // Esc key listener & body scroll lock & focus restoration
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end lg:justify-center lg:items-center p-0 lg:p-4 overflow-hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : ariaLabel}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        ref={containerRef}
        className={`w-full ${maxWidth} bg-[#FFFEF2] rounded-t-2xl lg:rounded-none border-t border-x lg:border border-[#333333] shadow-2xl flex flex-col max-h-[92vh] lg:max-h-[88vh] overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom lg:slide-in-from-bottom-0 lg:zoom-in-95 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visible Drag Handle on Mobile (Thumb Ergonomics) */}
        <div className="w-12 h-1.5 rounded-full bg-[#D9D7C9] mx-auto my-2.5 shrink-0 lg:hidden cursor-grab" aria-hidden="true" />

        {/* Header with Title and Close Button */}
        {!hideHeader && (
          <div className="flex items-start justify-between px-5 pt-1 pb-3 border-b border-[#D9D7C9] shrink-0">
            <div className="space-y-0.5 pr-4">
              {title && (
                <div className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A1A] leading-tight">
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="text-xs text-[#5C5C5C]">
                  {subtitle}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 p-2 text-[#5C5C5C] hover:text-black flex items-center justify-center rounded-xs transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-black"
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
