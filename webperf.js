// ==UserScript==
// @name         Web Performance Suite v5.3
// @namespace    https://github.com/RyAnPr1ME/webperf
// @version      5.3
// @description  Ultra-fast page loads: preemptive image/script/style rewriting, smart caching, adaptive FPS, lazy load, prefetching, live diagnostics.
// @author       You
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-start
// ==/UserScript==

(() => {
    'use strict';

    const WebPerf = {
        config: {
            imageRewriter: true,
            smartCache: true,
            adaptiveFPS: true,
            parallelPrefetch: true,
            workerAnalyzer: true,
            diagnosticsPanel: true,
            lazyLoadMedia: true,
            imageFormats: ['jpg', 'jpeg', 'png'],
            preferFormat: 'webp',
            backgroundFps: 12,
            activeFps: 60,
            cacheSizeLimitMB: 120,
            parallelPrefetchCount: 6,
            maxConcurrentFetches: 6,
        },

        diagnostics: { cacheHits: 0, cacheMisses: 0, rewrittenImages: 0 },
        memCache: new Map(),
        totalCacheBytes: 0,
        diagPanel: null,
        fpsTarget: 60,
        menuCommands: [],
        nativeRAF: window.requestAnimationFrame,

        log: {
            info: msg => console.log('%c[WebPerf] ' + msg, 'color: lime; font-weight: bold;'),
            warn: msg => console.warn('[WebPerf] ' + msg),
            debug: msg => console.debug('[WebPerf] ' + msg)
        },

        init() {
            this.fpsTarget = document.hidden ? this.config.backgroundFps : this.config.activeFps;
            this.registerMenu();
            this.toggleDiagnostics();
            this.overrideRAF();
            this.observeImages();
            this.observeLazyMedia();
            this.initWorker();
            this.prefetchAssets();
            this.interceptScripts();
            setInterval(() => this.updateDiagnostics(), 1000);

            document.addEventListener('visibilitychange', () => {
                this.fpsTarget = document.hidden ? this.config.backgroundFps : this.config.activeFps;
            });

            this.log.info('Web Performance Suite v5.3 initialized ⚡');
        },

        registerMenu() {
            Object.keys(this.config).forEach(key => {
                if (typeof this.config[key] === 'boolean') {
                    const cmd = GM_registerMenuCommand(`${this.config[key] ? 'Disable' : 'Enable'} ${key}`, () => {
                        this.toggleFeature(key);
                    });
                    this.menuCommands.push(cmd);
                }
            });
        },

        toggleFeature(feature) {
            this.config[feature] = !this.config[feature];
            this.log.info(`${feature} is now ${this.config[feature] ? 'ON' : 'OFF'}`);
            switch(feature) {
                case 'adaptiveFPS': this.overrideRAF(); break;
                case 'diagnosticsPanel': this.toggleDiagnostics(); break;
                case 'imageRewriter': if (this.config.imageRewriter) this.observeImages(); break;
                case 'lazyLoadMedia': if (this.config.lazyLoadMedia) this.observeLazyMedia(); break;
            }
        },

        /****************************
         * IMAGE INTERCEPTION
         ****************************/
        observeImages() {
            if (!this.config.imageRewriter) return;
            const optimize = async img => {
                try {
                    if (!img.src) return;
                    const url = new URL(img.src, location.href);
                    const ext = url.pathname.split('.').pop().toLowerCase();
                    if (!this.config.imageFormats.includes(ext)) return;

                    const newUrl = url.href.replace(new RegExp(`\\.${ext}$`, 'i'), `.${this.config.preferFormat}`);
                    const cachedUrl = await this.cacheFetch(newUrl);
                    img.src = cachedUrl;
                    this.diagnostics.rewrittenImages++;
                } catch (e) { this.log.warn(`Image rewrite failed: ${e}`); }
            };

            document.querySelectorAll('img').forEach(optimize);

            const observer = new MutationObserver(mutations => {
                for (const m of mutations) {
                    m.addedNodes.forEach(node => {
                        if (node.tagName === 'IMG') optimize(node);
                        if (node.querySelectorAll) node.querySelectorAll('img').forEach(optimize);
                    });
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        },

        /****************************
         * LAZY LOAD MEDIA
         ****************************/
        observeLazyMedia() {
            if (!this.config.lazyLoadMedia || !('IntersectionObserver' in window)) return;

            const io = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    if (el.dataset.src) el.src = el.dataset.src;
                    if (el.dataset.srcset) el.srcset = el.dataset.srcset;
                    io.unobserve(el);
                });
            });

            document.querySelectorAll('img[data-src], img[data-srcset], video[data-src]').forEach(el => io.observe(el));

            const observer = new MutationObserver(mutations => {
                for (const m of mutations) {
                    m.addedNodes.forEach(node => {
                        if (!node.querySelectorAll) return;
                        node.querySelectorAll('img[data-src], img[data-srcset], video[data-src]').forEach(el => io.observe(el));
                    });
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        },

        /****************************
         * SMART CACHE
         ****************************/
        async cacheFetch(url) {
            if (!this.config.smartCache) return url;
            if (this.memCache.has(url)) {
                const entry = this.memCache.get(url);
                this.memCache.delete(url);
                this.memCache.set(url, entry);
                this.diagnostics.cacheHits++;
                return entry.objUrl;
            }

            try {
                const res = await fetch(url, { cache: 'force-cache' });
                if (!res.ok) throw new Error(res.status);
                const blob = await res.blob();
                const objUrl = URL.createObjectURL(blob);
                this.totalCacheBytes += blob.size;
                this.memCache.set(url, { objUrl, size: blob.size });
                this.pruneCache();
                this.diagnostics.cacheMisses++;
                return objUrl;
            } catch (e) {
                this.log.warn(`Cache fetch failed for ${url}: ${e}`);
                return url;
            }
        },

        pruneCache() {
            const limit = this.config.cacheSizeLimitMB * 1024 * 1024;
            while (this.totalCacheBytes > limit && this.memCache.size > 0) {
                const oldestKey = this.memCache.keys().next().value;
                const { objUrl, size } = this.memCache.get(oldestKey);
                URL.revokeObjectURL(objUrl);
                this.memCache.delete(oldestKey);
                this.totalCacheBytes -= size;
            }
        },

        /****************************
         * ADAPTIVE FPS
         ****************************/
        overrideRAF() {
            if (!this.config.adaptiveFPS) {
                window.requestAnimationFrame = this.nativeRAF;
                return;
            }

            let lastFrame = 0;
            const rafWrapper = cb => {
                const now = performance.now();
                const interval = 1000 / this.fpsTarget;
                if (now - lastFrame >= interval) {
                    lastFrame = now;
                    return this.nativeRAF(cb);
                } else {
                    return setTimeout(() => rafWrapper(cb), interval - (now - lastFrame));
                }
            };

            window.requestAnimationFrame = rafWrapper;
        },

        /****************************
         * SCRIPT/STYLE INTERCEPTION
         ****************************/
        interceptScripts() {
            const observer = new MutationObserver(mutations => {
                for (const m of mutations) {
                    m.addedNodes.forEach(node => {
                        if (node.tagName === 'SCRIPT' && !node.type) {
                            node.type = 'text/blocked-js';
                            this.log.debug(`Blocked script: ${node.src || 'inline'}`);
                        }
                        if (node.tagName === 'LINK' && node.rel === 'stylesheet') {
                            node.media = 'print';
                            node.onload = () => node.media = 'all';
                        }
                    });
                }
            });
            observer.observe(document.head, { childList: true });
        },

        /****************************
         * PREFETCHER
         ****************************/
        prefetchAssets() {
            if (!this.config.parallelPrefetch) return;
            const urls = [...document.querySelectorAll('a[href^="' + location.origin + '"]')]
                .filter(a => a.offsetParent !== null)
                .slice(0, this.config.parallelPrefetchCount)
                .map(a => a.href);

            urls.forEach(url => {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = url;
                link.as = 'document';
                document.head.appendChild(link);
            });
        },

        /****************************
         * WORKER ANALYZER
         ****************************/
        initWorker() {
            if (!this.config.workerAnalyzer || !window.Worker) return;

            const blob = new Blob([`
                self.onmessage = e => {
                    const { type, html } = e.data;
                    if (type === 'analyzeDOM') {
                        const count = (html.match(/<img|<video|<iframe/gi) || []).length;
                        self.postMessage({ type: 'domStats', count });
                    } else if (type === 'compute') {
                        let sum = 0; for (let i = 0; i < 5e6; i++) sum += i;
                        self.postMessage({ type: 'computeDone', result: sum });
                    }
                };
            `], { type: 'application/javascript' });

            const worker = new Worker(URL.createObjectURL(blob));
            worker.onmessage = e => {
                if (e.data.type === 'domStats') this.log.info(`DOM contains ${e.data.count} media elements.`);
                if (e.data.type === 'computeDone') this.log.info(`Worker compute complete: ${e.data.result}`);
            };

            setTimeout(() => {
                worker.postMessage({ type: 'analyzeDOM', html: document.documentElement.outerHTML });
                worker.postMessage({ type: 'compute' });
            }, 2000);
        },

        /****************************
         * DIAGNOSTICS
         ****************************/
        toggleDiagnostics() {
            if (!this.config.diagnosticsPanel) {
                if (this.diagPanel) this.diagPanel.remove();
                this.diagPanel = null;
                return;
            }

            if (!this.diagPanel) {
                this.diagPanel = document.createElement('div');
                Object.assign(this.diagPanel.style, {
                    position: 'fixed', bottom: '8px', right: '8px',
                    background: 'rgba(0,0,0,0.75)', color: '#0f0',
                    padding: '6px 10px', fontSize: '12px', fontFamily: 'monospace',
                    borderRadius: '6px', zIndex: 999999, pointerEvents: 'auto'
                });
                document.body.appendChild(this.diagPanel);
            }
        },

        updateDiagnostics() {
            if (!this.config.diagnosticsPanel || !this.diagPanel) return;
            this.diagPanel.innerHTML = `
                <b>WebPerf v5.3</b><br>
                FPS: ${this.fpsTarget}<br>
                Cache Hits: ${this.diagnostics.cacheHits}<br>
                Cache Misses: ${this.diagnostics.cacheMisses}<br>
                Images Rewritten: ${this.diagnostics.rewrittenImages}<br>
                Memory Cache: ${(this.totalCacheBytes / 1024 / 1024).toFixed(2)} MB
            `;
        }
    };

    WebPerf.init();
})();
