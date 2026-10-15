/*
 * Pulls a file into the browser cache ahead of the moment it is needed, so
 * that asking for it later is answered from the machine rather than the
 * network. Used for the figures' models, which are megabytes each: hovering
 * the switch to the model view, or a tab inside it, is most of a second of
 * warning, which is about what one of them needs.
 *
 * A plain fetch, rather than drei's own preloader, because reaching for that
 * would mean importing three.js into a bundle that is split to avoid loading
 * it in the first place.
 */
const warmed = new Set<string>();

export function warm(url: string) {
  if (warmed.has(url)) return;
  warmed.add(url);

  // A failure here costs nothing: the file is fetched again, for real, when it
  // is actually asked for. Forgetting it means a later hover tries again rather
  // than the file never being warmed at all.
  void fetch(url).catch(() => warmed.delete(url));
}
