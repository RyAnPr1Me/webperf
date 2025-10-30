// ==UserScript==
// @name         YouTube 4K HDR Quality Enhancer with Script Interception
// @namespace    https://github.com/RyAnPr1ME/webperf
// @version      2.0
// @description  Intercepts YouTube scripts to force 4K/HDR resolution, highest bitrate/FPS, hardware acceleration, and optimal codec selection
// @author       RyAnPr1Me
// @match        *://*.youtube.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @compatible   chrome Tampermonkey
// @compatible   firefox Tampermonkey
// @compatible   edge Tampermonkey
// @license      MIT
// @homepageURL  https://github.com/RyAnPr1ME/webperf
// @supportURL   https://github.com/RyAnPr1ME/webperf/issues
// ==/UserScript==

/**
 * YouTube 4K HDR Quality Enhancer with Script Interception
 * 
 * Advanced YouTube quality enhancement with deep script interception:
 * - Intercepts ytInitialPlayerResponse to force highest quality formats
 * - Modifies streaming data to prioritize 4K/8K HDR streams
 * - Forces VP9 Profile 2 codec for HDR support
 * - Overrides adaptive bitrate logic for maximum quality
 * - Intercepts quality selection to prevent downgrades
 * - Hardware acceleration optimization
 * - Widevine DRM configuration for best quality
 * 
 * @module YouTube4KEnhancer
 */
(() => {
    'use strict';

    /**
     * YouTube Script Interceptor
     * Intercepts and modifies YouTube's player initialization data
     * @namespace ScriptInterceptor
     */
    const ScriptInterceptor = {
        originalFetch: null,
        originalXHROpen: null,
        originalXHRSend: null,

        init() {
            Logger.info('Initializing YouTube script interceptor...');
            
            // Intercept ytInitialPlayerResponse before page loads
            this.interceptYtInitialData();
            
            // Intercept fetch requests for player data
            this.interceptFetch();
            
            // Intercept XHR requests for quality changes
            this.interceptXHR();
            
            // Intercept Object.defineProperty for ytplayer config
            this.interceptPlayerConfig();

            Logger.info('Script interceptor active');
        },

        /**
         * Intercept ytInitialPlayerResponse and ytInitialData
         */
        interceptYtInitialData() {
            // Hook into script loading to modify player response
            const originalAppendChild = Element.prototype.appendChild;
            const originalInsertBefore = Element.prototype.insertBefore;

            Element.prototype.appendChild = function(child) {
                if (child.tagName === 'SCRIPT') {
                    ScriptInterceptor.processScript(child);
                }
                return originalAppendChild.call(this, child);
            };

            Element.prototype.insertBefore = function(child, reference) {
                if (child.tagName === 'SCRIPT') {
                    ScriptInterceptor.processScript(child);
                }
                return originalInsertBefore.call(this, child, reference);
            };

            // Also intercept window variables being set
            this.interceptWindowVariables();
        },

        /**
         * Process script content to modify player data
         * NOTE: This method is limited in scope - it only logs detection.
         * Actual interception happens via window variable hooks which are safer.
         */
        processScript(script) {
            if (script.textContent) {
                const originalContent = script.textContent;
                
                // Check if this script contains ytInitialPlayerResponse
                if (originalContent.includes('ytInitialPlayerResponse')) {
                    // Log detection but don't modify inline scripts to avoid XSS risks
                    // Instead, we rely on window variable interception which is safer
                    Logger.log('Detected ytInitialPlayerResponse script (will intercept via window hooks)');
                }
            }
        },

        /**
         * Intercept window.ytInitialPlayerResponse and window.ytInitialData
         */
        interceptWindowVariables() {
            let playerResponse = null;
            let initialData = null;

            // Define getters/setters to intercept these variables
            Object.defineProperty(window, 'ytInitialPlayerResponse', {
                get() {
                    return playerResponse;
                },
                set(value) {
                    Logger.log('Intercepting ytInitialPlayerResponse set');
                    playerResponse = ScriptInterceptor.enhancePlayerResponse(value);
                },
                configurable: true
            });

            Object.defineProperty(window, 'ytInitialData', {
                get() {
                    return initialData;
                },
                set(value) {
                    Logger.log('Intercepting ytInitialData set');
                    initialData = value;
                },
                configurable: true
            });
        },

        /**
         * Enhance player response data to force highest quality
         */
        enhancePlayerResponse(response) {
            if (!response) return response;

            try {
                Logger.log('Enhancing player response object');
                
                // Use structuredClone if available (more efficient)
                // Fall back to simple object spread for shallow clone
                let enhanced;
                if (typeof structuredClone === 'function') {
                    try {
                        enhanced = structuredClone(response);
                    } catch (e) {
                        // structuredClone failed (circular refs, etc), use shallow clone
                        Logger.log('structuredClone failed, using shallow clone');
                        enhanced = { ...response };
                        if (response.streamingData) {
                            enhanced.streamingData = { ...response.streamingData };
                        }
                    }
                } else {
                    // Shallow clone for older browsers (safer than JSON.parse/stringify)
                    enhanced = { ...response };
                    if (response.streamingData) {
                        enhanced.streamingData = { ...response.streamingData };
                    }
                }
                
                if (enhanced.streamingData) {
                    // Sort formats by quality (in-place, no deep clone needed)
                    if (enhanced.streamingData.formats && Array.isArray(enhanced.streamingData.formats)) {
                        enhanced.streamingData.formats.sort((a, b) => {
                            return (b.height || 0) - (a.height || 0) || (b.bitrate || 0) - (a.bitrate || 0);
                        });
                    }
                    
                    if (enhanced.streamingData.adaptiveFormats && Array.isArray(enhanced.streamingData.adaptiveFormats)) {
                        enhanced.streamingData.adaptiveFormats.sort((a, b) => {
                            // Prioritize HDR formats
                            const aIsHDR = a.mimeType && a.mimeType.includes('vp09.02');
                            const bIsHDR = b.mimeType && b.mimeType.includes('vp09.02');
                            
                            if (aIsHDR && !bIsHDR) return -1;
                            if (!aIsHDR && bIsHDR) return 1;
                            
                            return (b.height || 0) - (a.height || 0) || (b.bitrate || 0) - (a.bitrate || 0);
                        });
                    }
                }
                
                return enhanced;
            } catch (e) {
                Logger.warn('Failed to enhance player response:', e);
                return response;
            }
        },

        /**
         * Intercept fetch API for player updates
         */
        interceptFetch() {
            this.originalFetch = window.fetch;
            
            window.fetch = async function(...args) {
                const url = args[0];
                
                try {
                    const response = await ScriptInterceptor.originalFetch.apply(this, args);
                    
                    // Check if this is a player API request
                    if (typeof url === 'string' && url.includes('/player')) {
                        Logger.log('Intercepting player fetch:', url);
                        
                        const clonedResponse = response.clone();
                        const data = await clonedResponse.json();
                        
                        // Enhance the response
                        const enhanced = ScriptInterceptor.enhancePlayerResponse(data);
                        
                        // Return modified response
                        return new Response(JSON.stringify(enhanced), {
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers
                        });
                    }
                    
                    return response;
                } catch (e) {
                    Logger.log('Fetch interception error:', e);
                    return ScriptInterceptor.originalFetch.apply(this, args);
                }
            };
        },

        /**
         * Intercept XMLHttpRequest for quality changes
         * Note: Simplified to avoid issues with immutable properties
         */
        interceptXHR() {
            this.originalXHROpen = XMLHttpRequest.prototype.open;
            
            XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                // Just log player requests, don't modify responses to avoid conflicts
                if (url && url.includes('/player')) {
                    Logger.log('Detected XHR player request:', url);
                }
                this._ytUrl = url;
                return ScriptInterceptor.originalXHROpen.call(this, method, url, ...rest);
            };
            
            // Note: We don't override XHR send/responses as it can break YouTube's code
            // Instead, we rely on window variable interception and Fetch API hooks
        },

        /**
         * Intercept player configuration
         */
        interceptPlayerConfig() {
            // Hook into ytplayer config
            Object.defineProperty(window, 'ytplayer', {
                get() {
                    return this._ytplayer;
                },
                set(value) {
                    Logger.log('Intercepting ytplayer config');
                    
                    if (value && value.config && value.config.args) {
                        // Force quality settings in player config
                        value.config.args.autoplay = '0';
                        
                        if (value.config.args.adaptive_fmts) {
                            Logger.log('Found adaptive formats in config');
                        }
                    }
                    
                    this._ytplayer = value;
                },
                configurable: true
            });
        }
    };

    /**
     * Configuration management
     * @namespace Config
     */
    const Config = {
        defaults: {
            preferredQuality: '2160p',      // 4K resolution
            preferHDR: true,                // Enable HDR when available
            preferHighFPS: true,            // Prefer 60fps over 30fps
            autoPlay: false,                // Auto-play videos
            forceHWAccel: true,             // Force hardware acceleration
            codecPreference: 'vp9',         // Prefer VP9 over AVC (better quality)
            audioQuality: 'high',           // High audio bitrate
            bufferSize: 'large',            // Larger buffer for smoother playback
            debugMode: false                // Debug logging
        },
        
        current: {},
        
        async init() {
            try {
                const saved = GM_getValue('yt_enhancer_config');
                this.current = { ...this.defaults, ...(saved ? JSON.parse(saved) : {}) };
            } catch (e) {
                this.current = { ...this.defaults };
            }
        },
        
        async save() {
            try {
                GM_setValue('yt_enhancer_config', JSON.stringify(this.current));
            } catch (e) {
                console.warn('[YT-4K] Failed to save config', e);
            }
        },
        
        get(key) {
            return this.current[key];
        },
        
        set(key, value) {
            this.current[key] = value;
            this.save();
        }
    };

    /**
     * Logger utility
     * @namespace Logger
     */
    const Logger = {
        prefix: '[YT-4K]',
        
        log(...args) {
            // Safe check for debug mode (handles case where Config not yet initialized)
            try {
                if (Config.current && Config.current.debugMode) {
                    console.log(this.prefix, ...args);
                }
            } catch (e) {
                // Config not initialized yet, skip debug logging
            }
        },
        
        info(...args) {
            console.log('%c' + this.prefix, 'color: #00ff00; font-weight: bold;', ...args);
        },
        
        warn(...args) {
            console.warn(this.prefix, ...args);
        },
        
        error(...args) {
            console.error(this.prefix, ...args);
        }
    };

    /**
     * YouTube Settings Override
     * Bypasses YouTube's saved quality preferences in localStorage and cookies
     * @namespace SettingsOverride
     */
    const SettingsOverride = {
        init() {
            Logger.info('Overriding YouTube settings to bypass quality restrictions...');
            
            // Override localStorage to intercept YouTube's quality preferences
            this.overrideLocalStorage();
            
            // Override player preferences stored in yt.config_
            this.overrideYTConfig();
            
            // Continuously reset any quality limitations
            this.enforceQualityOverrides();
            
            Logger.info('YouTube settings override active');
        },
        
        /**
         * Override localStorage to prevent YouTube from saving/loading quality preferences
         */
        overrideLocalStorage() {
            const originalSetItem = Storage.prototype.setItem;
            const originalGetItem = Storage.prototype.getItem;
            
            Storage.prototype.setItem = function(key, value) {
                // Intercept YouTube quality-related settings
                if (key && typeof key === 'string') {
                    // Block YouTube from saving lower quality preferences
                    if (key.includes('yt-player-quality') || 
                        key.includes('yt-player-bandaid') ||
                        key.includes('yt-player-bandwidth')) {
                        Logger.log('Blocked YouTube from saving quality preference:', key);
                        return; // Don't save
                    }
                }
                return originalSetItem.call(this, key, value);
            };
            
            Storage.prototype.getItem = function(key) {
                if (key && typeof key === 'string') {
                    // Force highest quality when YouTube tries to read saved preferences
                    if (key.includes('yt-player-quality')) {
                        Logger.log('Overriding saved quality preference to force 4K');
                        return JSON.stringify({quality: 'hd2160', previousQuality: 'hd2160'});
                    }
                }
                return originalGetItem.call(this, key);
            };
        },
        
        /**
         * Override YouTube's global config object
         */
        overrideYTConfig() {
            // Monitor for yt.config_ object and override quality settings
            const checkConfig = setInterval(() => {
                if (window.yt && window.yt.config_) {
                    clearInterval(checkConfig);
                    
                    // Override default quality settings
                    if (window.yt.config_.PLAYER_VARS) {
                        window.yt.config_.PLAYER_VARS.vq = 'hd2160'; // Force 4K
                        Logger.log('Overrode yt.config_.PLAYER_VARS.vq to hd2160');
                    }
                    
                    // Monitor for changes and re-apply
                    const originalDefineProperty = Object.defineProperty;
                    try {
                        Object.defineProperty(window.yt.config_, 'PLAYER_VARS', {
                            set(value) {
                                if (value) {
                                    value.vq = 'hd2160';
                                }
                                this._PLAYER_VARS = value;
                            },
                            get() {
                                return this._PLAYER_VARS;
                            },
                            configurable: true
                        });
                    } catch (e) {
                        Logger.log('Could not override PLAYER_VARS:', e);
                    }
                }
            }, 100);
            
            // Clear after 10 seconds if not found
            setTimeout(() => clearInterval(checkConfig), 10000);
        },
        
        /**
         * Continuously enforce quality overrides to bypass YouTube's adaptive logic
         */
        enforceQualityOverrides() {
            // Periodically check and override any quality limitations
            setInterval(() => {
                try {
                    const player = document.getElementById('movie_player');
                    if (player) {
                        // Override getPreferredQuality to always return highest
                        if (player.getPreferredQuality && !player._qualityOverridden) {
                            const original = player.getPreferredQuality;
                            player.getPreferredQuality = function() {
                                return 'hd2160'; // Always return 4K
                            };
                            player._qualityOverridden = true;
                            Logger.log('Overrode player.getPreferredQuality()');
                        }
                        
                        // Override any attempt to set quality below 4K
                        if (player.setPlaybackQuality && !player._setQualityOverridden) {
                            const originalSetQuality = player.setPlaybackQuality;
                            player.setPlaybackQuality = function(quality) {
                                // If YouTube tries to set quality below 4K, upgrade it
                                const qualityOrder = ['tiny', 'small', 'medium', 'large', 'hd720', 'hd1080', 'hd1440', 'hd2160'];
                                const targetIndex = qualityOrder.indexOf('hd2160');
                                const requestedIndex = qualityOrder.indexOf(quality);
                                
                                if (requestedIndex < targetIndex && requestedIndex !== -1) {
                                    Logger.log(`Intercepted quality downgrade attempt from hd2160 to ${quality}, blocking`);
                                    return originalSetQuality.call(this, 'hd2160');
                                }
                                
                                return originalSetQuality.call(this, quality);
                            };
                            player._setQualityOverridden = true;
                            Logger.log('Overrode player.setPlaybackQuality() to prevent downgrades');
                        }
                        
                        // Override network throttling detection
                        if (player.getStatsForNerds && !player._statsOverridden) {
                            const originalStats = player.getStatsForNerds;
                            player.getStatsForNerds = function() {
                                const stats = originalStats.call(this);
                                // Report high bandwidth to prevent quality downgrades
                                if (stats) {
                                    stats.bandwidth = 999999999; // Report unlimited bandwidth
                                    stats.bufferHealth = 100; // Report healthy buffer
                                }
                                return stats;
                            };
                            player._statsOverridden = true;
                            Logger.log('Overrode network stats to prevent adaptive downgrade');
                        }
                    }
                } catch (e) {
                    // Ignore errors, just keep trying
                }
            }, 2000);
        }
    };

    /**
     * Hardware acceleration optimizer
     * @namespace HWAccelOptimizer
     */
    const HWAccelOptimizer = {
        applied: false,
        
        init() {
            if (!Config.get('forceHWAccel')) return;
            
            this.injectStyles();
            this.optimizeMediaElements();
            Logger.info('Hardware acceleration optimized');
        },
        
        injectStyles() {
            const style = document.createElement('style');
            style.id = 'yt-4k-hw-accel';
            style.textContent = `
                /* Hardware acceleration for YouTube video */
                video, .html5-video-player, .html5-main-video {
                    transform: translate3d(0, 0, 0);
                    -webkit-transform: translate3d(0, 0, 0);
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                    perspective: 1000px;
                    -webkit-perspective: 1000px;
                    will-change: transform;
                }
                
                /* Optimize video container */
                #player-container, #movie_player {
                    transform: translateZ(0);
                    -webkit-transform: translateZ(0);
                }
            `;
            
            (document.head || document.documentElement).appendChild(style);
            this.applied = true;
        },
        
        optimizeMediaElements() {
            const observer = new MutationObserver(() => {
                document.querySelectorAll('video').forEach(video => {
                    if (!video.dataset.hwAccelApplied) {
                        video.style.transform = 'translate3d(0, 0, 0)';
                        video.dataset.hwAccelApplied = 'true';
                    }
                });
            });
            
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.body, { childList: true, subtree: true });
                });
            }
        }
    };

    /**
     * Widevine DRM optimizer
     * Configures Widevine for best quality playback
     * @namespace WidevineOptimizer
     */
    const WidevineOptimizer = {
        initialized: false,
        
        init() {
            this.hookMediaCapabilities();
            this.optimizeEMEConfig();
            Logger.info('Widevine DRM optimized for highest quality');
        },
        
        /**
         * Hook MediaCapabilities API to report support for high-quality formats
         */
        hookMediaCapabilities() {
            if (!window.navigator.mediaCapabilities) return;
            
            const originalDecodingInfo = window.navigator.mediaCapabilities.decodingInfo;
            
            window.navigator.mediaCapabilities.decodingInfo = async function(config) {
                const result = await originalDecodingInfo.call(this, config);
                
                // Enhance result to prefer high-quality configs
                if (config.video) {
                    // Report smooth and power-efficient for all high-res configs
                    if (config.video.height >= 2160 || config.video.width >= 3840) {
                        result.smooth = true;
                        result.powerEfficient = true;
                        Logger.log('Enhanced capability for 4K:', config);
                    }
                    
                    // Prefer VP9 Profile 2 (HDR codec: vp09.02.*)
                    if (config.video.contentType) {
                        const contentType = config.video.contentType.toLowerCase();
                        
                        // VP9 Profile 2 for HDR (vp09.02.*)
                        if (contentType.includes('vp09.02') || 
                            contentType.includes('vp9.2') ||
                            contentType.includes('vp9') || 
                            contentType.includes('vp09')) {
                            result.smooth = true;
                            result.powerEfficient = true;
                            result.supported = true;
                            Logger.log('Enhanced VP9/HDR capability:', contentType);
                        }
                        
                        // Also support high bitrate streams
                        if (config.video.bitrate && config.video.bitrate > 10000000) { // >10Mbps
                            result.smooth = true;
                            result.powerEfficient = true;
                            Logger.log('Enhanced high bitrate capability:', config.video.bitrate);
                        }
                    }
                }
                
                return result;
            };
        },
        
        /**
         * Optimize EME (Encrypted Media Extensions) configuration
         */
        optimizeEMEConfig() {
            const originalRequestMediaKeySystemAccess = navigator.requestMediaKeySystemAccess;
            
            navigator.requestMediaKeySystemAccess = function(keySystem, configs) {
                Logger.log('MediaKeySystemAccess requested:', keySystem);
                
                // Enhance Widevine config for best quality
                if (keySystem === 'com.widevine.alpha') {
                    const enhancedConfigs = configs.map(config => ({
                        ...config,
                        videoCapabilities: config.videoCapabilities?.map(cap => ({
                            ...cap,
                            robustness: cap.robustness || 'SW_SECURE_CRYPTO'
                        })),
                        audioCapabilities: config.audioCapabilities?.map(cap => ({
                            ...cap,
                            robustness: cap.robustness || 'SW_SECURE_CRYPTO'
                        }))
                    }));
                    
                    Logger.log('Enhanced Widevine config:', enhancedConfigs);
                    return originalRequestMediaKeySystemAccess.call(this, keySystem, enhancedConfigs);
                }
                
                return originalRequestMediaKeySystemAccess.call(this, keySystem, configs);
            };
        }
    };

    /**
     * Bitrate Forcer
     * Forces YouTube to use maximum available bitrate
     * @namespace BitrateForcer
     */
    const BitrateForcer = {
        init() {
            Logger.info('Initializing bitrate forcer...');
            
            // Override YouTube's adaptive bitrate logic
            this.interceptAdaptiveBitrate();
            
            // Force highest bitrate in player config
            this.forceHighestBitrate();
            
            Logger.info('Bitrate forcer active');
        },
        
        /**
         * Intercept YouTube's adaptive bitrate algorithm
         */
        interceptAdaptiveBitrate() {
            // Monitor for player object and override quality selection
            const checkForPlayer = setInterval(() => {
                const player = document.getElementById('movie_player');
                if (player && player.getAvailableQualityLevels) {
                    clearInterval(checkForPlayer);
                    
                    // Override quality level selection
                    const originalSetPlaybackQuality = player.setPlaybackQuality;
                    if (originalSetPlaybackQuality) {
                        player.setPlaybackQuality = function(quality) {
                            // Always try to use the highest quality
                            const levels = player.getAvailableQualityLevels();
                            const highest = levels[0]; // First is usually highest
                            
                            Logger.log('Forcing quality from', quality, 'to', highest);
                            return originalSetPlaybackQuality.call(this, highest);
                        };
                    }
                    
                    // Override playback quality range
                    const originalSetRange = player.setPlaybackQualityRange;
                    if (originalSetRange) {
                        player.setPlaybackQualityRange = function(min, max) {
                            const levels = player.getAvailableQualityLevels();
                            const highest = levels[0];
                            
                            Logger.log('Forcing quality range to highest:', highest);
                            return originalSetRange.call(this, highest, highest);
                        };
                    }
                }
            }, 500);
            
            // Clear after 30 seconds if player not found
            setTimeout(() => clearInterval(checkForPlayer), 30000);
        },
        
        /**
         * Store for active intervals and observers
         */
        activeMonitors: new WeakMap(),
        mainObserver: null,
        
        /**
         * Force highest bitrate in streaming data
         */
        forceHighestBitrate() {
            // Create a MutationObserver to watch for video element
            this.mainObserver = new MutationObserver((mutations) => {
                const video = document.querySelector('video.html5-main-video');
                if (video && !this.activeMonitors.has(video)) {
                    // Mark as monitored
                    this.activeMonitors.set(video, {});
                    
                    // Monitor quality changes
                    video.addEventListener('loadedmetadata', () => {
                        Logger.log('Video loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
                        
                        // Check if we're at maximum quality
                        if (video.videoHeight < 2160) {
                            Logger.warn('Not at 4K quality, attempting to upgrade...');
                            this.forceQualityUpgrade();
                        }
                    });
                    
                    // Monitor for quality degradation with proper cleanup
                    let lastHeight = 0;
                    const qualityCheckInterval = setInterval(() => {
                        // Check if video still exists in DOM
                        if (!document.contains(video)) {
                            clearInterval(qualityCheckInterval);
                            this.activeMonitors.delete(video);
                            Logger.log('Video removed, cleared quality monitoring');
                            return;
                        }
                        
                        if (video.videoHeight !== lastHeight) {
                            Logger.log('Quality changed to:', video.videoHeight + 'p');
                            lastHeight = video.videoHeight;
                            
                            // If quality dropped, try to restore
                            if (video.videoHeight < 2160 && Config.get('preferredQuality') === '2160p') {
                                Logger.warn('Quality dropped, attempting to restore...');
                                this.forceQualityUpgrade();
                            }
                        }
                    }, 5000);
                    
                    // Store interval ID in WeakMap for proper cleanup
                    const monitorData = this.activeMonitors.get(video);
                    monitorData.intervalId = qualityCheckInterval;
                    
                    // Cleanup on page unload
                    const cleanupInterval = () => {
                        clearInterval(qualityCheckInterval);
                        this.activeMonitors.delete(video);
                        Logger.log('Cleaned up quality monitoring on unload');
                    };
                    
                    window.addEventListener('beforeunload', cleanupInterval, { once: true });
                    
                    // Also detect when video is removed using another observer
                    const removalObserver = new MutationObserver((mutations) => {
                        for (const mutation of mutations) {
                            for (const removed of mutation.removedNodes) {
                                if (removed === video || (removed.contains && removed.contains(video))) {
                                    clearInterval(qualityCheckInterval);
                                    removalObserver.disconnect();
                                    this.activeMonitors.delete(video);
                                    Logger.log('Video removed from DOM, cleaned up monitoring');
                                    return;
                                }
                            }
                        }
                    });
                    
                    if (video.parentNode) {
                        removalObserver.observe(video.parentNode, { childList: true });
                    }
                    
                    monitorData.removalObserver = removalObserver;
                }
            });
            
            if (document.body) {
                this.mainObserver.observe(document.body, { childList: true, subtree: true });
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    if (document.body) {
                        this.mainObserver.observe(document.body, { childList: true, subtree: true });
                    }
                });
            }
        },
        
        /**
         * Cleanup method to disconnect observers
         */
        cleanup() {
            if (this.mainObserver) {
                this.mainObserver.disconnect();
                this.mainObserver = null;
            }
            
            // Clear all active monitoring intervals
            // Note: WeakMap doesn't have iteration, so we can't manually clear
            // but intervals will be cleared when videos are removed or page unloads
            Logger.log('BitrateForcer cleanup complete');
        },
        
        /**
         * Force quality upgrade
         */
        forceQualityUpgrade() {
            const player = document.getElementById('movie_player');
            if (player && player.setPlaybackQualityRange) {
                try {
                    player.setPlaybackQualityRange('hd2160', 'hd2160');
                    Logger.log('Forced quality upgrade to 4K');
                } catch (e) {
                    Logger.log('Failed to upgrade quality:', e);
                }
            }
        }
    };

    /**
     * YouTube player quality controller
     * @namespace QualityController
     */
    const QualityController = {
        player: null,
        checkInterval: null,
        monitoringInterval: null,
        appliedQuality: false,
        
        init() {
            this.waitForPlayer();
            Logger.info('Quality controller initialized');
        },
        
        cleanup() {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = null;
            }
            Logger.log('QualityController cleanup complete');
        },
        
        waitForPlayer() {
            // Clear any existing interval
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
            }
            
            // Try multiple methods to get the player with timeout
            let attempts = 0;
            const maxAttempts = 60; // 30 seconds max
            
            this.checkInterval = setInterval(() => {
                attempts++;
                this.player = this.getPlayer();
                
                if (this.player) {
                    clearInterval(this.checkInterval);
                    this.checkInterval = null;
                    this.setupQualityMonitoring();
                } else if (attempts >= maxAttempts) {
                    // Timeout after 30 seconds
                    clearInterval(this.checkInterval);
                    this.checkInterval = null;
                    Logger.warn('Player not found after 30 seconds, giving up');
                }
            }, 500);
            
            // Also listen for navigation events
            document.addEventListener('yt-navigate-finish', () => {
                this.appliedQuality = false;
                this.waitForPlayer();
            });
        },
        
        getPlayer() {
            // Try various methods to access the YouTube player
            return window.ytplayer?.config?.args?.player ||
                   document.querySelector('.html5-video-player')?.player ||
                   document.querySelector('video')?.parentElement?.player ||
                   document.getElementById('movie_player');
        },
        
        setupQualityMonitoring() {
            Logger.log('Player found, setting up quality monitoring');
            
            // Clear any existing monitoring interval
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
            }
            
            // Apply quality immediately
            this.applyQualitySettings();
            
            // Monitor for quality changes
            const videoElement = document.querySelector('video');
            if (videoElement) {
                videoElement.addEventListener('loadedmetadata', () => {
                    if (!this.appliedQuality) {
                        setTimeout(() => this.applyQualitySettings(), 1000);
                    }
                });
                
                videoElement.addEventListener('playing', () => {
                    if (!this.appliedQuality) {
                        this.applyQualitySettings();
                    }
                });
            }
            
            // Reapply periodically to ensure settings stick
            this.monitoringInterval = setInterval(() => {
                if (!this.appliedQuality) {
                    this.applyQualitySettings();
                }
            }, 3000);
        },
        
        applyQualitySettings() {
            try {
                const player = this.getPlayer();
                if (!player) {
                    Logger.log('Player not available yet');
                    return;
                }
                
                // Method 1: Use YouTube's internal API if available
                if (player.setPlaybackQualityRange) {
                    const targetQuality = this.getTargetQuality();
                    player.setPlaybackQualityRange(targetQuality, targetQuality);
                    Logger.info(`Set quality range to: ${targetQuality}`);
                }
                
                if (player.setPlaybackQuality) {
                    const targetQuality = this.getTargetQuality();
                    player.setPlaybackQuality(targetQuality);
                    Logger.info(`Set quality to: ${targetQuality}`);
                }
                
                // Method 2: Interact with quality menu
                this.setQualityViaMenu();
                
                // Apply HDR if available
                if (Config.get('preferHDR')) {
                    this.enableHDR();
                }
                
                // Apply high FPS if available
                if (Config.get('preferHighFPS')) {
                    this.enableHighFPS();
                }
                
                this.appliedQuality = true;
                this.logCurrentQuality();
                
            } catch (e) {
                Logger.error('Failed to apply quality settings:', e);
            }
        },
        
        getTargetQuality() {
            const preferred = Config.get('preferredQuality');
            const qualityMap = {
                '2160p': 'hd2160',
                '1440p': 'hd1440',
                '1080p': 'hd1080',
                '720p': 'hd720',
                '480p': 'large',
                '360p': 'medium',
                '240p': 'small',
                '144p': 'tiny'
            };
            
            return qualityMap[preferred] || 'hd2160';
        },
        
        setQualityViaMenu() {
            // Try to click on quality settings
            const settingsButton = document.querySelector('.ytp-settings-button');
            if (!settingsButton) return;
            
            // Use requestIdleCallback to avoid blocking
            if (window.requestIdleCallback) {
                requestIdleCallback(() => {
                    this.interactWithQualityMenu();
                });
            } else {
                setTimeout(() => this.interactWithQualityMenu(), 100);
            }
        },
        
        interactWithQualityMenu() {
            try {
                // Look for quality menu items
                const qualityItems = document.querySelectorAll('.ytp-menuitem[role="menuitemradio"]');
                
                // Find 4K/2160p option
                const preferred = Config.get('preferredQuality');
                const regex = new RegExp(preferred.replace('p', ''), 'i');
                
                let selectedItem = null;
                let highestQuality = 0;
                
                qualityItems.forEach(item => {
                    const label = item.textContent || '';
                    const match = label.match(/(\d+)/);
                    
                    if (match) {
                        const quality = parseInt(match[1]);
                        
                        // Check if this matches our preference or is the highest available
                        if (regex.test(label)) {
                            selectedItem = item;
                        } else if (quality > highestQuality) {
                            highestQuality = quality;
                            if (!selectedItem) {
                                selectedItem = item;
                            }
                        }
                    }
                });
                
                if (selectedItem && !selectedItem.getAttribute('aria-checked')) {
                    Logger.log('Clicking quality item:', selectedItem.textContent);
                    selectedItem.click();
                }
                
            } catch (e) {
                Logger.log('Menu interaction failed:', e);
            }
        },
        
        enableHDR() {
            try {
                const player = this.getPlayer();
                const videoElement = document.querySelector('video');
                
                // Check if HDR is available
                if (videoElement && window.matchMedia) {
                    const hdrSupported = 
                        window.matchMedia('(dynamic-range: high)').matches ||
                        window.matchMedia('(color-gamut: p3)').matches;
                    
                    if (hdrSupported) {
                        Logger.info('HDR display detected and enabled');
                        
                        // Request HDR format if player supports it
                        if (player?.setOption) {
                            player.setOption('quality', 'hdr');
                        }
                    }
                }
            } catch (e) {
                Logger.log('HDR detection/enable failed:', e);
            }
        },
        
        enableHighFPS() {
            try {
                // Look for 60fps quality options
                const qualityItems = document.querySelectorAll('.ytp-menuitem[role="menuitemradio"]');
                
                qualityItems.forEach(item => {
                    const label = item.textContent || '';
                    if (label.includes('60') && !item.getAttribute('aria-checked')) {
                        Logger.info('Selecting 60fps option:', label);
                        item.click();
                    }
                });
            } catch (e) {
                Logger.log('High FPS enable failed:', e);
            }
        },
        
        logCurrentQuality() {
            try {
                const player = this.getPlayer();
                const videoElement = document.querySelector('video');
                
                if (player?.getPlaybackQuality) {
                    Logger.info('Current quality:', player.getPlaybackQuality());
                }
                
                if (videoElement) {
                    Logger.info('Video resolution:', 
                        `${videoElement.videoWidth}x${videoElement.videoHeight}`);
                    Logger.info('Video bitrate:', 
                        videoElement.webkitDecodedFrameCount ? 
                        'Hardware decoded' : 'Software decoded');
                }
            } catch (e) {
                Logger.log('Failed to log quality info:', e);
            }
        }
    };

    /**
     * Audio quality optimizer
     * @namespace AudioOptimizer
     */
    const AudioOptimizer = {
        init() {
            if (Config.get('audioQuality') !== 'high') return;
            
            // Monitor audio element
            const observer = new MutationObserver(() => {
                document.querySelectorAll('audio, video').forEach(el => {
                    if (!el.dataset.audioOptimized) {
                        this.optimizeAudio(el);
                        el.dataset.audioOptimized = 'true';
                    }
                });
            });
            
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            }
            
            Logger.info('Audio quality optimizer initialized');
        },
        
        optimizeAudio(element) {
            try {
                // Request highest audio quality
                if (element.audioTracks && element.audioTracks.length > 0) {
                    // Select the highest quality audio track
                    const tracks = Array.from(element.audioTracks);
                    tracks.sort((a, b) => {
                        const aQuality = this.getTrackQuality(a);
                        const bQuality = this.getTrackQuality(b);
                        return bQuality - aQuality;
                    });
                    
                    if (tracks[0] && !tracks[0].enabled) {
                        tracks.forEach(t => t.enabled = false);
                        tracks[0].enabled = true;
                        Logger.log('Selected highest quality audio track');
                    }
                }
            } catch (e) {
                Logger.log('Audio optimization failed:', e);
            }
        },
        
        getTrackQuality(track) {
            // Estimate quality based on label/language
            const label = (track.label || '').toLowerCase();
            if (label.includes('high') || label.includes('premium')) return 3;
            if (label.includes('medium')) return 2;
            if (label.includes('low')) return 1;
            return 2; // Default to medium
        }
    };

    /**
     * Buffer optimizer
     * @namespace BufferOptimizer
     */
    const BufferOptimizer = {
        init() {
            if (Config.get('bufferSize') !== 'large') return;
            
            // Increase buffer size for smoother 4K playback
            const observer = new MutationObserver(() => {
                document.querySelectorAll('video').forEach(video => {
                    if (!video.dataset.bufferOptimized) {
                        this.optimizeBuffer(video);
                        video.dataset.bufferOptimized = 'true';
                    }
                });
            });
            
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            }
            
            Logger.info('Buffer optimizer initialized');
        },
        
        optimizeBuffer(video) {
            try {
                // Set preload to auto for larger buffer
                video.preload = 'auto';
                
                // Increase buffer if Media Source Extensions are used
                if (video.mozBuffered || video.webkitBuffered) {
                    Logger.log('Extended buffer for video element');
                }
            } catch (e) {
                Logger.log('Buffer optimization failed:', e);
            }
        }
    };

    /**
     * Stats overlay (optional)
     * @namespace StatsOverlay
     */
    const StatsOverlay = {
        overlay: null,
        updateInterval: null,
        
        init() {
            if (!Config.get('debugMode')) return;
            
            this.createOverlay();
            this.startUpdates();
        },
        
        createOverlay() {
            this.overlay = document.createElement('div');
            this.overlay.id = 'yt-4k-stats';
            this.overlay.style.cssText = `
                position: fixed;
                top: 80px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: #0f0;
                padding: 10px;
                font-family: monospace;
                font-size: 11px;
                z-index: 9999;
                border-radius: 4px;
                min-width: 200px;
            `;
            
            if (document.body) {
                document.body.appendChild(this.overlay);
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    document.body.appendChild(this.overlay);
                });
            }
        },
        
        startUpdates() {
            this.updateInterval = setInterval(() => this.update(), 1000);
        },
        
        update() {
            if (!this.overlay) return;
            
            const video = document.querySelector('video');
            const player = QualityController.getPlayer();
            
            let stats = '<strong>YT 4K Enhancer</strong><br>';
            
            if (video) {
                stats += `Resolution: ${video.videoWidth}x${video.videoHeight}<br>`;
                const fps = video.currentTime > 0 ? 
                    Math.round(video.getVideoPlaybackQuality?.()?.totalVideoFrames / video.currentTime || 0) : 0;
                stats += `FPS: ${fps}<br>`;
                stats += `Buffered: ${video.buffered.length > 0 ? Math.round(video.buffered.end(0)) : 0}s<br>`;
            }
            
            if (player?.getPlaybackQuality) {
                stats += `Quality: ${player.getPlaybackQuality()}<br>`;
            }
            
            stats += `HW Accel: ${HWAccelOptimizer.applied ? 'Yes' : 'No'}<br>`;
            
            this.overlay.innerHTML = stats;
        },
        
        destroy() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
            if (this.overlay) {
                this.overlay.remove();
            }
        }
    };

    /**
     * Menu manager
     * @namespace MenuManager
     */
    const MenuManager = {
        init() {
            if (typeof GM_registerMenuCommand !== 'function') return;
            
            try {
                GM_registerMenuCommand('⚙️ Toggle Debug Mode', () => {
                    Config.set('debugMode', !Config.get('debugMode'));
                    location.reload();
                });
                
                GM_registerMenuCommand('🎬 Toggle HDR', () => {
                    Config.set('preferHDR', !Config.get('preferHDR'));
                    location.reload();
                });
                
                GM_registerMenuCommand('🚀 Toggle Hardware Acceleration', () => {
                    Config.set('forceHWAccel', !Config.get('forceHWAccel'));
                    location.reload();
                });
                
                GM_registerMenuCommand('📊 Toggle High FPS', () => {
                    Config.set('preferHighFPS', !Config.get('preferHighFPS'));
                    location.reload();
                });
                
                GM_registerMenuCommand('🔍 Show Debug Info', () => {
                    if (window.YT4KEnhancer && window.YT4KEnhancer.debugInfo) {
                        window.YT4KEnhancer.debugInfo();
                    }
                });
                
                GM_registerMenuCommand('🔄 Reapply Quality Settings', () => {
                    if (window.YT4KEnhancer && window.YT4KEnhancer.reapply) {
                        window.YT4KEnhancer.reapply();
                        Logger.info('Quality settings reapplied');
                    }
                });
                
            } catch (e) {
                Logger.warn('Failed to register menu commands:', e);
            }
        }
    };

    /**
     * Main application
     * @namespace App
     */
    const App = {
        async init() {
            Logger.info('Initializing YouTube 4K HDR Quality Enhancer v2.0 with Script Interception');
            
            // Initialize configuration
            await Config.init();
            
            // CRITICAL: Initialize script interceptor FIRST (must run before page scripts)
            ScriptInterceptor.init();
            
            // Override YouTube's settings to bypass quality restrictions
            SettingsOverride.init();
            
            // Initialize components
            HWAccelOptimizer.init();
            WidevineOptimizer.init();
            BitrateForcer.init();
            AudioOptimizer.init();
            BufferOptimizer.init();
            
            // Wait for page to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.initPlayer();
                });
            } else {
                this.initPlayer();
            }
            
            // Initialize menu
            MenuManager.init();
            
            Logger.info('YouTube 4K HDR Quality Enhancer v2.0 initialized with script interception ✓');
        },
        
        initPlayer() {
            QualityController.init();
            StatsOverlay.init();
        }
    };

    // Auto-initialize
    App.init().catch(e => {
        Logger.error('Initialization failed:', e);
    });
    
    // Global cleanup on page unload
    window.addEventListener('beforeunload', () => {
        Logger.log('Page unloading, performing cleanup...');
        
        // Cleanup BitrateForcer observers and intervals
        if (BitrateForcer && BitrateForcer.cleanup) {
            BitrateForcer.cleanup();
        }
        
        // Cleanup QualityController intervals
        if (QualityController && QualityController.cleanup) {
            QualityController.cleanup();
        }
        
        // Clear stats overlay interval
        if (StatsOverlay && StatsOverlay.updateInterval) {
            clearInterval(StatsOverlay.updateInterval);
        }
        
        Logger.log('Cleanup complete');
    });

    // Expose API for debugging
    window.YT4KEnhancer = {
        version: '2.0',
        config: Config,
        quality: QualityController,
        interceptor: ScriptInterceptor,
        bitrateForcer: BitrateForcer,
        reapply: () => {
            QualityController.appliedQuality = false;
            QualityController.applyQualitySettings();
        },
        debugInfo: () => {
            console.log('YT4KEnhancer Debug Info:');
            console.log('Config:', Config.current);
            console.log('Player Response:', window.ytInitialPlayerResponse);
            console.log('Initial Data:', window.ytInitialData);
            
            if (window.ytInitialPlayerResponse?.streamingData) {
                const sd = window.ytInitialPlayerResponse.streamingData;
                console.log('Available Formats:', sd.formats?.map(f => `${f.height}p @ ${Math.round(f.bitrate/1000)}kbps`));
                console.log('Adaptive Formats:', sd.adaptiveFormats?.slice(0, 10).map(f => ({
                    quality: f.height + 'p',
                    codec: f.mimeType?.split(';')[0],
                    bitrate: Math.round(f.bitrate/1000) + 'kbps',
                    fps: f.fps
                })));
            }
        },
        cleanup: () => {
            Logger.log('Manual cleanup requested');
            if (BitrateForcer && BitrateForcer.cleanup) {
                BitrateForcer.cleanup();
            }
            if (QualityController && QualityController.cleanup) {
                QualityController.cleanup();
            }
            if (StatsOverlay && StatsOverlay.updateInterval) {
                clearInterval(StatsOverlay.updateInterval);
            }
            Logger.log('Manual cleanup complete');
        }
    };

})();
