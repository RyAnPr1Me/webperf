// ==UserScript==
// @name         Privacy & URL Cleaner Suite
// @namespace    https://github.com/RyAnPr1ME/webperf
// @version      1.1
// @description  Cleans URLs, strips tracking parameters, blocks redirect links, resolves shorteners, nukes cookie popups, and hides referrers — all automatically. Now with small toast notifications.
// @author       RyAnPr1Me
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @compatible   chrome Tampermonkey
// @compatible   firefox Tampermonkey
// @license      MIT
// ==/UserScript==

(() => {
    'use strict';

    const Logger = {
        log(...a) { console.log('%c[PrivacyCleaner]', 'color:#0f0;', ...a); },
        toast(msg) {
            const div = document.createElement('div');
            div.textContent = msg;
            Object.assign(div.style, {
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.75)',
                color: '#0f0',
                fontSize: '12px',
                fontFamily: 'monospace',
                padding: '6px 10px',
                borderRadius: '6px',
                opacity: '0',
                zIndex: 999999,
                transition: 'opacity 0.4s ease',
                pointerEvents: 'none'
            });
            document.body.appendChild(div);
            requestAnimationFrame(() => div.style.opacity = '1');
            setTimeout(() => {
                div.style.opacity = '0';
                setTimeout(() => div.remove(), 400);
            }, 1600);
        }
    };

    // ====== URL PARAM CLEANER ======
    // Optimized: Combined into single regex for better performance
    const TRACKING_PARAM_REGEX = /^(utm_|fbclid|gclid|mc_eid|ga_.+|yclid|vero_id|_hsenc|_hsmi|mkt_tok|oly_.+|cmpid|ref|spm|igshid|si|msclkid|twclid)$/;

    function cleanURL(url) {
        try {
            const u = new URL(url);
            let changed = false;
            
            // Iterate directly over searchParams for better performance
            for (const key of u.searchParams.keys()) {
                if (TRACKING_PARAM_REGEX.test(key)) {
                    u.searchParams.delete(key);
                    changed = true;
                }
            }
            
            return changed ? u.toString() : url;
        } catch {
            return url;
        }
    }

    function cleanCurrentURL() {
        const clean = cleanURL(location.href);
        if (clean !== location.href) {
            history.replaceState(null, '', clean);
            Logger.log('Cleaned URL:', clean);
            Logger.toast('🧹 Cleaned tracking parameters');
        }
    }

    // ====== REDIRECT STRIPPER ======
    // Optimized: Compile regex once for better performance
    const REDIRECT_REGEX = /google\..+\/url\?q=|facebook\.com\/l\.php|t\.co\//;
    
    function stripRedirects() {
        document.addEventListener('mousedown', e => {
            const a = e.target.closest('a[href]');
            if (!a) return;
            const url = a.href;
            if (REDIRECT_REGEX.test(url)) {
                try {
                    // Optimized: Parse URL once instead of twice
                    const urlObj = new URL(url);
                    const real = urlObj.searchParams.get('q') ||
                                 urlObj.searchParams.get('u') ||
                                 a.href;
                    if (real && real.startsWith('http')) {
                        a.href = real;
                        Logger.toast('🔗 Redirect stripped');
                    }
                } catch {}
            }
        }, true);
    }

    // ====== SHORTLINK RESOLVER ======
    // Optimized: Use Set for O(1) lookup instead of Array.includes O(n)
    const SHORT_DOMAINS = new Set([
        't.co', 'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 'buff.ly',
        'shorturl.at', 'is.gd', 'cutt.ly', 'rb.gy', 's.id', 'v.gd'
    ]);

    function expandShortLinks() {
        const links = document.querySelectorAll('a[href]');
        links.forEach(a => {
            try {
                const u = new URL(a.href);
                if (SHORT_DOMAINS.has(u.hostname.replace(/^www\./, ''))) {
                    GM_xmlhttpRequest({
                        method: 'HEAD',
                        url: a.href,
                        redirect: 'follow',
                        onload: resp => {
                            const final = resp.finalUrl || a.href;
                            if (final && final !== a.href) {
                                a.href = final;
                                a.title = 'Expanded: ' + final;
                                Logger.log('Expanded shortlink →', final);
                                Logger.toast('🔓 Expanded shortlink');
                            }
                        }
                    });
                }
            } catch {}
        });
    }

    // ====== COOKIE POPUP AUTO-REJECTOR ======
    function autoRejectCookies() {
        // Optimized: Combined selector for better performance
        const selector = '[id*="cookie"] button, [class*="cookie"] button, button[aria-label*="reject"]';
        const rejectPattern = /reject|decline|deny|refuse/i;
        
        // Debounce mutation observer to reduce CPU usage
        let timeout;
        const observer = new MutationObserver(() => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                document.querySelectorAll(selector).forEach(btn => {
                    if (btn && !btn.dataset.processed && rejectPattern.test(btn.innerText)) {
                        btn.dataset.processed = 'true'; // Mark as processed to avoid re-clicking
                        btn.click();
                        Logger.toast('🍪 Cookies rejected');
                    }
                });
            }, 100); // Debounce by 100ms
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // ====== REFERRER CLEANER ======
    Object.defineProperty(document, 'referrer', { get: () => '', configurable: true });
    Object.defineProperty(Document.prototype, 'referrer', { get: () => '', configurable: true });

    // ====== MENU ======
    GM_registerMenuCommand('🧹 Clean Current URL', cleanCurrentURL);
    GM_registerMenuCommand('🔗 Expand Shortlinks', expandShortLinks);

    // ====== INIT ======
    const run = () => {
        cleanCurrentURL();
        stripRedirects();
        expandShortLinks();
        autoRejectCookies();
        Logger.log('Privacy & URL Cleaner Suite active ✓');
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
})();
