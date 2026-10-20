// "Where to buy" takes either a shop name ("Packages Mall") or a link
// ("daraz.pk/watches"). Only the second kind can be opened, so we work out which
// one it is before showing it as something tappable.

// A link is anything that already names a scheme, or reads like a domain:
// no spaces, a dot, and at least two letters after the last dot.
const LOOKS_LIKE_URL = /^[a-z][a-z0-9+.-]*:\/\//i;
const LOOKS_LIKE_DOMAIN = /^[^\s/]+\.[a-z]{2,}(\/\S*)?$/i;

/** Is this "where to buy" something we could actually open? */
export function isLink(where: string | undefined): boolean {
  const text = where?.trim() ?? '';
  if (!text) return false;
  return LOOKS_LIKE_URL.test(text) || LOOKS_LIKE_DOMAIN.test(text);
}

/**
 * The address to open. A link typed without "https://" still works, because
 * nobody types it: "daraz.pk/watches" becomes "https://daraz.pk/watches".
 */
export function linkUrl(where: string): string {
  const text = where.trim();
  return LOOKS_LIKE_URL.test(text) ? text : `https://${text}`;
}

/** How a link reads on screen: no scheme, no trailing slash, kept short. */
export function linkLabel(where: string, max = 32): string {
  const text = where.trim().replace(LOOKS_LIKE_URL, '').replace(/\/+$/, '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
