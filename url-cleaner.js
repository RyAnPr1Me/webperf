// ==UserScript==
// @name         Universal URL Cleaner
// @namespace    https://github.com/anti-tracking-utils
// @version      1.4
// @description  Removes tracking junk (utm, fbclid, gclid, etc.) from URLs on all sites
// @author       you
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  // Common tracking parameters to nuke
  const TRACKING_PARAMS = [
    /^utm_.+/i,
    /^(fb|ig|tt|tw|li|mc)clid$/i,
    /^ga_.+/i,
    /^gclsrc$/i,
    /^yclid$/i,
    /^msclkid$/i,
    /^dclid$/i,
    /^vero_.+/i,
    /^cmpid$/i,
    /^scid$/i,
    /^soc_src$/i,
    /^soc_trk$/i,
    /^_hsenc$/i,
    /^_hsmi$/i,
    /^mkt_tok$/i
  ];

  /**
   * Cleans a URL string by removing known tracking params.
   * Returns a cleaned string or null if no change.
   */
  function cleanUrl(url) {
    try {
      const u = new URL(url, location.origin);
      const original = u.toString();
      let changed = false;

      // Remove bad params
      for (const key of [...u.searchParams.keys()]) {
        if (TRACKING_PARAMS.some(rx => rx.test(key))) {
          u.searchParams.delete(key);
          changed = true;
        }
      }

      // Remove trailing "?" or "&" if empty
      if (!u.searchParams.toString()) {
        u.search = '';
      }

      // Some trackers hide stuff in fragments
      if (u.hash && /utm_|fbclid|gclid/i.test(u.hash)) {
        u.hash = '';
        changed = true;
      }

      return changed ? u.toString() : null;
    } catch {
      return null;
    }
  }

  /** Rewrites document URL early */
  function cleanCurrentUrl() {
    const cleaned = cleanUrl(location.href);
    if (cleaned && cleaned !== location.href) {
      history.replaceState(null, '', cleaned);
    }
  }

  /** Cleans all visible links */
  function cleanLinks() {
    document.querySelectorAll('a[href]').forEach(a => {
      const cleaned = cleanUrl(a.href);
      if (cleaned && cleaned !== a.href) a.href = cleaned;
    });
  }

  /** Intercept navigation before sending trackers */
  function interceptClick() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const cleaned = cleanUrl(a.href);
      if (cleaned && cleaned !== a.href) a.href = cleaned;
    }, true);
  }

  // Clean as early as possible
  cleanCurrentUrl();

  // Handle dynamically loaded links
  const obs = new MutationObserver(() => cleanLinks());
  obs.observe(document, { childList: true, subtree: true });

  // Initial sweep + click interception
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => cleanLinks());
  } else {
    cleanLinks();
  }
  interceptClick();
})();
