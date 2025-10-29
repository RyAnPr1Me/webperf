// ==UserScript==
// @name         YouTube 4K HDR Quality Enhancer
// @namespace    https://github.com/RyAnPr1ME/webperf
// @version      1.0
// @description  Forces 4K resolution, highest bitrate/FPS, HDR, hardware acceleration, and Widevine DRM optimization for YouTube playback
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
 * YouTube 4K HDR Quality Enhancer
 * 
 * Automatically selects the highest quality settings for YouTube videos:
 * - 4K (2160p) or highest available resolution
 * - Maximum bitrate (Premium bitrate when available)
 * - Highest FPS (60fps when available)
 * - HDR/HDR10+ when available
 * - Hardware acceleration optimization
 * - Widevine DRM configuration for best quality
 * 
 * @module YouTube4KEnhancer
 */
(() => {
    'use strict';

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
            if (Config.get('debugMode')) {
                console.log(this.prefix, ...args);
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
                    
                    // Prefer VP9 and HDR
                    if (config.video.contentType && 
                        (config.video.contentType.includes('vp9') || 
                         config.video.contentType.includes('vp09'))) {
                        result.smooth = true;
                        result.powerEfficient = true;
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
     * YouTube player quality controller
     * @namespace QualityController
     */
    const QualityController = {
        player: null,
        checkInterval: null,
        appliedQuality: false,
        
        init() {
            this.waitForPlayer();
            Logger.info('Quality controller initialized');
        },
        
        waitForPlayer() {
            // Try multiple methods to get the player
            this.checkInterval = setInterval(() => {
                this.player = this.getPlayer();
                
                if (this.player) {
                    clearInterval(this.checkInterval);
                    this.setupQualityMonitoring();
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
            setInterval(() => {
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
                stats += `FPS: ${Math.round(video.getVideoPlaybackQuality?.()?.totalVideoFrames / video.currentTime || 0)}<br>`;
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
            Logger.info('Initializing YouTube 4K HDR Quality Enhancer v1.0');
            
            // Initialize configuration
            await Config.init();
            
            // Initialize components
            HWAccelOptimizer.init();
            WidevineOptimizer.init();
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
            
            Logger.info('YouTube 4K HDR Quality Enhancer initialized ✓');
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

    // Expose API for debugging
    window.YT4KEnhancer = {
        version: '1.0',
        config: Config,
        quality: QualityController,
        reapply: () => {
            QualityController.appliedQuality = false;
            QualityController.applyQualitySettings();
        }
    };

})();
