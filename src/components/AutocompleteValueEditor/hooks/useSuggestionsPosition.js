import { useFloating, offset, flip, shift, size, autoUpdate } from '@floating-ui/react';

/**
 * Positions the suggestions list relative to the input using Floating UI.
 *
 * Floating UI handles:
 *   • Tracking on scroll & resize (via `autoUpdate` — only the actual
 *     scrollable ancestors, not a global capture listener)
 *   • Flipping above the input when there's no room below
 *   • Shifting horizontally so the list never overflows the viewport
 *   • Matching the width of the input
 *
 * @param {boolean} isOpen - whether the suggestions list is visible
 * @returns {{ refs, floatingStyles }} — refs to attach + inline styles for the list
 */
export const useSuggestionsPosition = (isOpen) => {
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    placement: 'bottom-start',
    strategy: 'fixed',

    // Only attach scroll/resize listeners while the list is open
    whileElementsMounted: autoUpdate,

    middleware: [
      // 4px gap between input and list
      offset(4),

      // Flip above when not enough space below
      flip({ padding: 8 }),

      // Shift horizontally to stay inside viewport
      shift({ padding: 8 }),

      // Match the width of the reference (input) element
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
  });

  return { refs, floatingStyles };
};
