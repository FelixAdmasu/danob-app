import type { SyntheticEvent } from 'react';

/** 1×1 transparent GIF — a valid src that silences the broken-image glyph. */
const BLANK =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * Fallback for stored image URLs that may 404 (e.g. files lost when a deploy
 * wiped the ephemeral disk before storage was externalised).
 *
 * Swaps the broken image for a themed placeholder box instead of the browser's
 * broken-image glyph: `.img-fallback` in resources/css/app.css paints a muted
 * surface (`--muted`, so it follows the active theme) with a centered image
 * icon. Guards against re-entry via `data-fallback` so it never loops.
 */
export function onImageError(e: SyntheticEvent<HTMLImageElement>): void {
    const img = e.currentTarget;
    if (img.dataset.fallback === 'true') {
        return;
    }
    img.dataset.fallback = 'true';
    img.src = BLANK;
    img.classList.add('img-fallback');
}
