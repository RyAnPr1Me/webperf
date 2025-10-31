// ==UserScript==
// @name         Anti-Fingerprinting Suite
// @namespace    https://github.com/RyAnPr1ME/webperf
// @version      1.0
// @description  Comprehensive browser fingerprinting protection: Canvas, WebGL, Audio, Fonts, Screen, User-Agent, WebRTC, and more
// @author       RyAnPr1Me
// @match        *://*/*
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
 * Anti-Fingerprinting Suite
 * 
 * Protects against various browser fingerprinting techniques:
 * - Canvas fingerprinting
 * - WebGL fingerprinting
 * - Audio context fingerprinting
 * - Font enumeration
 * - Screen resolution tracking
 * - User agent detection
 * - WebRTC IP leak
 * - Battery API
 * - Hardware concurrency
 * - Device memory
 * - Platform detection
 * 
 * @module AntiFingerprintingSuite
 */
(() => {
    'use strict';

    /**
     * Configuration management
     * @namespace Config
     */
    const Config = {
        defaults: {
            protectCanvas: true,
            protectWebGL: true,
            protectAudio: true,
            protectFonts: true,
            protectScreen: true,
            protectUserAgent: true,
            protectWebRTC: true,
            protectBattery: true,
            protectHardware: true,
            protectTimezone: true,
            protectLanguages: true,
            protectPlugins: true,
            randomizeNoise: true,       // Add random noise to fingerprints
            consistentSession: true,     // Keep fingerprint consistent within session
            debugMode: false
        },
        
        current: {},
        sessionData: {},
        
        async init() {
            try {
                const saved = GM_getValue('anti_fp_config');
                this.current = { ...this.defaults, ...(saved ? JSON.parse(saved) : {}) };
                
                // Initialize session data for consistent randomization
                this.sessionData = {
                    canvasNoise: this.generateNoise(),
                    webglNoise: this.generateNoise(),
                    audioNoise: this.generateNoise(),
                    screenOffset: { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) },
                    hardwareCores: 2 + Math.floor(Math.random() * 6), // 2-8 cores
                    deviceMemory: [2, 4, 8, 16][Math.floor(Math.random() * 4)]
                };
            } catch (e) {
                this.current = { ...this.defaults };
            }
        },
        
        generateNoise() {
            return Math.random() * 0.0001 - 0.00005; // Small random noise
        },
        
        async save() {
            try {
                GM_setValue('anti_fp_config', JSON.stringify(this.current));
            } catch (e) {
                console.warn('[Anti-FP] Failed to save config', e);
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
        prefix: '[Anti-FP]',
        
        log(...args) {
            if (Config.get('debugMode')) {
                console.log(this.prefix, ...args);
            }
        },
        
        info(...args) {
            console.log('%c' + this.prefix, 'color: #00ffff; font-weight: bold;', ...args);
        },
        
        warn(...args) {
            console.warn(this.prefix, ...args);
        },
        
        error(...args) {
            console.error(this.prefix, ...args);
        }
    };

    /**
     * Canvas fingerprinting protection
     * @namespace CanvasProtection
     */
    const CanvasProtection = {
        init() {
            if (!Config.get('protectCanvas')) return;
            
            this.protectToDataURL();
            this.protectGetImageData();
            this.protectToBlob();
            
            Logger.info('Canvas fingerprinting protection enabled');
        },
        
        protectToDataURL() {
            const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
            
            HTMLCanvasElement.prototype.toDataURL = function(...args) {
                if (Config.get('randomizeNoise')) {
                    this.addNoise();
                }
                return originalToDataURL.apply(this, args);
            };
        },
        
        protectGetImageData() {
            const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
            
            CanvasRenderingContext2D.prototype.getImageData = function(...args) {
                const imageData = originalGetImageData.apply(this, args);
                
                if (Config.get('randomizeNoise')) {
                    this.addNoiseToImageData(imageData);
                }
                
                return imageData;
            };
        },
        
        protectToBlob() {
            const originalToBlob = HTMLCanvasElement.prototype.toBlob;
            
            HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
                if (Config.get('randomizeNoise')) {
                    this.addNoise();
                }
                return originalToBlob.call(this, callback, ...args);
            };
        },
        
        addNoise() {
            try {
                const ctx = this.getContext('2d');
                if (!ctx) return;
                
                const imageData = ctx.getImageData(0, 0, this.width, this.height);
                const noise = Config.sessionData.canvasNoise;
                const noiseValue = Math.floor(noise * 255);
                
                // Optimized: Add minimal noise to prevent fingerprinting
                // Only modify red channel for better performance
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const newValue = data[i] + noiseValue;
                    // Branchless clamping is faster than Math.max/Math.min
                    data[i] = newValue < 0 ? 0 : (newValue > 255 ? 255 : newValue);
                }
                
                ctx.putImageData(imageData, 0, 0);
                Logger.log('Added canvas noise');
            } catch (e) {
                Logger.log('Canvas noise failed:', e);
            }
        }
    };
    
    // Add method to CanvasRenderingContext2D
    CanvasRenderingContext2D.prototype.addNoiseToImageData = function(imageData) {
        if (!Config.get('randomizeNoise')) return;
        
        const noise = Config.sessionData.canvasNoise;
        const noiseValue = Math.floor(noise * 255);
        const data = imageData.data;
        
        // Optimized: branchless clamping for better performance
        for (let i = 0; i < data.length; i += 4) {
            const newValue = data[i] + noiseValue;
            data[i] = newValue < 0 ? 0 : (newValue > 255 ? 255 : newValue);
        }
    };
    
    // Add method to HTMLCanvasElement
    HTMLCanvasElement.prototype.addNoise = CanvasProtection.addNoise;

    /**
     * WebGL fingerprinting protection
     * @namespace WebGLProtection
     */
    const WebGLProtection = {
        init() {
            if (!Config.get('protectWebGL')) return;
            
            this.protectRenderer();
            this.protectVendor();
            this.protectParameters();
            
            Logger.info('WebGL fingerprinting protection enabled');
        },
        
        protectRenderer() {
            const getParameterOriginal = WebGLRenderingContext.prototype.getParameter;
            
            WebGLRenderingContext.prototype.getParameter = function(parameter) {
                // Spoof renderer and vendor strings
                if (parameter === this.RENDERER) {
                    return 'Intel Iris OpenGL Engine';
                }
                if (parameter === this.VENDOR) {
                    return 'Intel Inc.';
                }
                if (parameter === this.VERSION) {
                    return 'WebGL 1.0';
                }
                if (parameter === this.SHADING_LANGUAGE_VERSION) {
                    return 'WebGL GLSL ES 1.0';
                }
                
                return getParameterOriginal.call(this, parameter);
            };
            
            // Also protect WebGL2
            if (window.WebGL2RenderingContext) {
                const getParameter2Original = WebGL2RenderingContext.prototype.getParameter;
                
                WebGL2RenderingContext.prototype.getParameter = function(parameter) {
                    if (parameter === this.RENDERER) {
                        return 'Intel Iris OpenGL Engine';
                    }
                    if (parameter === this.VENDOR) {
                        return 'Intel Inc.';
                    }
                    if (parameter === this.VERSION) {
                        return 'WebGL 2.0';
                    }
                    if (parameter === this.SHADING_LANGUAGE_VERSION) {
                        return 'WebGL GLSL ES 3.0';
                    }
                    
                    return getParameter2Original.call(this, parameter);
                };
            }
        },
        
        protectVendor() {
            const getExtensionOriginal = WebGLRenderingContext.prototype.getExtension;
            
            WebGLRenderingContext.prototype.getExtension = function(name) {
                // Block debug renderer info extension
                if (name === 'WEBGL_debug_renderer_info') {
                    Logger.log('Blocked WEBGL_debug_renderer_info');
                    return null;
                }
                
                return getExtensionOriginal.call(this, name);
            };
            
            if (window.WebGL2RenderingContext) {
                const getExtension2Original = WebGL2RenderingContext.prototype.getExtension;
                
                WebGL2RenderingContext.prototype.getExtension = function(name) {
                    if (name === 'WEBGL_debug_renderer_info') {
                        Logger.log('Blocked WEBGL_debug_renderer_info (WebGL2)');
                        return null;
                    }
                    
                    return getExtension2Original.call(this, name);
                };
            }
        },
        
        protectParameters() {
            // Add noise to floating point precision
            const originalReadPixels = WebGLRenderingContext.prototype.readPixels;
            
            WebGLRenderingContext.prototype.readPixels = function(...args) {
                originalReadPixels.apply(this, args);
                
                if (Config.get('randomizeNoise') && args[6]) {
                    const data = args[6];
                    const noise = Config.sessionData.webglNoise;
                    
                    for (let i = 0; i < data.length; i++) {
                        data[i] = Math.min(255, data[i] + Math.floor(noise * 255));
                    }
                }
            };
        }
    };

    /**
     * Audio context fingerprinting protection
     * @namespace AudioProtection
     */
    const AudioProtection = {
        init() {
            if (!Config.get('protectAudio')) return;
            
            this.protectAudioContext();
            this.protectOfflineAudioContext();
            
            Logger.info('Audio fingerprinting protection enabled');
        },
        
        protectAudioContext() {
            if (!window.AudioContext && !window.webkitAudioContext) return;
            
            const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
            const OriginalAudioContext = AudioContextConstructor;
            
            window.AudioContext = class extends OriginalAudioContext {
                constructor(...args) {
                    super(...args);
                    this.addAudioNoise();
                }
                
                addAudioNoise() {
                    const originalCreateBuffer = this.createBuffer.bind(this);
                    this.createBuffer = function(...args) {
                        const buffer = originalCreateBuffer(...args);
                        
                        if (Config.get('randomizeNoise')) {
                            const noise = Config.sessionData.audioNoise;
                            for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                                const data = buffer.getChannelData(channel);
                                for (let i = 0; i < data.length; i++) {
                                    data[i] += noise;
                                }
                            }
                        }
                        
                        return buffer;
                    };
                }
            };
            
            if (window.webkitAudioContext) {
                window.webkitAudioContext = window.AudioContext;
            }
        },
        
        protectOfflineAudioContext() {
            if (!window.OfflineAudioContext) return;
            
            const OriginalOfflineAudioContext = window.OfflineAudioContext;
            
            window.OfflineAudioContext = class extends OriginalOfflineAudioContext {
                constructor(...args) {
                    super(...args);
                    this.addAudioNoise();
                }
                
                addAudioNoise() {
                    const originalStartRendering = this.startRendering.bind(this);
                    this.startRendering = async function() {
                        const buffer = await originalStartRendering();
                        
                        if (Config.get('randomizeNoise')) {
                            const noise = Config.sessionData.audioNoise;
                            for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                                const data = buffer.getChannelData(channel);
                                for (let i = 0; i < data.length; i++) {
                                    data[i] += noise;
                                }
                            }
                        }
                        
                        return buffer;
                    };
                }
            };
        }
    };

    /**
     * Font enumeration protection
     * @namespace FontProtection
     */
    const FontProtection = {
        init() {
            if (!Config.get('protectFonts')) return;
            
            this.protectFontList();
            
            Logger.info('Font enumeration protection enabled');
        },
        
        protectFontList() {
            // Limit available fonts to common ones
            const commonFonts = [
                'Arial', 'Helvetica', 'Times New Roman', 'Courier New',
                'Verdana', 'Georgia', 'Palatino', 'Garamond',
                'Comic Sans MS', 'Trebuchet MS', 'Impact'
            ];
            
            // Override font check methods
            if (document.fonts && document.fonts.check) {
                const originalCheck = document.fonts.check.bind(document.fonts);
                
                document.fonts.check = function(font, text) {
                    const fontFamily = font.match(/['"]?([^'"]+)['"]?/)?.[1];
                    
                    // Only report common fonts as available
                    if (fontFamily && !commonFonts.includes(fontFamily)) {
                        Logger.log('Blocked font check for:', fontFamily);
                        return false;
                    }
                    
                    return originalCheck(font, text);
                };
            }
        }
    };

    /**
     * Screen resolution protection
     * @namespace ScreenProtection
     */
    const ScreenProtection = {
        init() {
            if (!Config.get('protectScreen')) return;
            
            this.spoofScreenProperties();
            
            Logger.info('Screen resolution protection enabled');
        },
        
        spoofScreenProperties() {
            const offset = Config.sessionData.screenOffset;
            
            // Use session-consistent screen resolution
            if (!Config.sessionData.screenResolution) {
                // Common screen resolutions to blend in
                const commonResolutions = [
                    { width: 1920, height: 1080 },
                    { width: 1366, height: 768 },
                    { width: 1440, height: 900 },
                    { width: 1536, height: 864 }
                ];
                
                Config.sessionData.screenResolution = commonResolutions[Math.floor(Math.random() * commonResolutions.length)];
            }
            
            const spoofed = Config.sessionData.screenResolution;
            
            Object.defineProperties(window.screen, {
                width: { value: spoofed.width, configurable: true },
                height: { value: spoofed.height, configurable: true },
                availWidth: { value: spoofed.width - offset.x, configurable: true },
                availHeight: { value: spoofed.height - offset.y, configurable: true },
                colorDepth: { value: 24, configurable: true },
                pixelDepth: { value: 24, configurable: true }
            });
            
            Logger.log('Spoofed screen to:', spoofed);
        }
    };

    /**
     * User agent protection
     * @namespace UserAgentProtection
     */
    const UserAgentProtection = {
        init() {
            if (!Config.get('protectUserAgent')) return;
            
            this.spoofUserAgent();
            this.spoofPlatform();
            
            Logger.info('User agent protection enabled');
        },
        
        spoofUserAgent() {
            // Use a common Chrome user agent
            const commonUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            
            Object.defineProperty(navigator, 'userAgent', {
                get: () => commonUA,
                configurable: true
            });
            
            Object.defineProperty(navigator, 'appVersion', {
                get: () => '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                configurable: true
            });
            
            Logger.log('Spoofed user agent');
        },
        
        spoofPlatform() {
            Object.defineProperty(navigator, 'platform', {
                get: () => 'Win32',
                configurable: true
            });
            
            Object.defineProperty(navigator, 'vendor', {
                get: () => 'Google Inc.',
                configurable: true
            });
        }
    };

    /**
     * WebRTC leak protection
     * @namespace WebRTCProtection
     */
    const WebRTCProtection = {
        init() {
            if (!Config.get('protectWebRTC')) return;
            
            this.blockWebRTC();
            
            Logger.info('WebRTC leak protection enabled');
        },
        
        blockWebRTC() {
            // Disable getUserMedia with a function that returns rejected promise
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const blockedError = () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
                navigator.mediaDevices.getUserMedia = blockedError;
                navigator.webkitGetUserMedia = blockedError;
                navigator.mozGetUserMedia = blockedError;
            }
            
            // Block RTCPeerConnection
            if (window.RTCPeerConnection) {
                const OriginalRTCPeerConnection = window.RTCPeerConnection;
                
                window.RTCPeerConnection = function(config) {
                    // Modify ICE servers to prevent IP leak
                    if (config && config.iceServers) {
                        config.iceServers = [];
                    }
                    return new OriginalRTCPeerConnection(config);
                };
            }
            
            Logger.log('WebRTC leak protection active');
        }
    };

    /**
     * Battery API protection
     * @namespace BatteryProtection
     */
    const BatteryProtection = {
        init() {
            if (!Config.get('protectBattery')) return;
            
            this.blockBatteryAPI();
            
            Logger.info('Battery API protection enabled');
        },
        
        blockBatteryAPI() {
            if (navigator.getBattery) {
                navigator.getBattery = async () => {
                    return {
                        charging: true,
                        chargingTime: 0,
                        dischargingTime: Infinity,
                        level: 1.0,
                        addEventListener: () => {},
                        removeEventListener: () => {}
                    };
                };
                
                Logger.log('Battery API spoofed');
            }
        }
    };

    /**
     * Hardware protection
     * @namespace HardwareProtection
     */
    const HardwareProtection = {
        init() {
            if (!Config.get('protectHardware')) return;
            
            this.spoofHardwareConcurrency();
            this.spoofDeviceMemory();
            
            Logger.info('Hardware fingerprinting protection enabled');
        },
        
        spoofHardwareConcurrency() {
            const cores = Config.sessionData.hardwareCores;
            
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => cores,
                configurable: true
            });
            
            Logger.log('Spoofed hardware concurrency to:', cores);
        },
        
        spoofDeviceMemory() {
            const memory = Config.sessionData.deviceMemory;
            
            Object.defineProperty(navigator, 'deviceMemory', {
                get: () => memory,
                configurable: true
            });
            
            Logger.log('Spoofed device memory to:', memory, 'GB');
        }
    };

    /**
     * Timezone protection
     * @namespace TimezoneProtection
     */
    const TimezoneProtection = {
        init() {
            if (!Config.get('protectTimezone')) return;
            
            this.spoofTimezone();
            
            Logger.info('Timezone protection enabled');
        },
        
        spoofTimezone() {
            const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
            
            Date.prototype.getTimezoneOffset = function() {
                // UTC (0 offset)
                return 0;
            };
            
            // Spoof Intl timezone
            if (Intl.DateTimeFormat) {
                const OriginalDateTimeFormat = Intl.DateTimeFormat;
                
                Intl.DateTimeFormat = function(...args) {
                    if (args.length === 0) {
                        args = ['en-US', { timeZone: 'UTC' }];
                    } else if (!args[1] || !args[1].timeZone) {
                        args[1] = { ...(args[1] || {}), timeZone: 'UTC' };
                    }
                    return new OriginalDateTimeFormat(...args);
                };
                
                Intl.DateTimeFormat.prototype = OriginalDateTimeFormat.prototype;
            }
            
            Logger.log('Spoofed timezone to UTC');
        }
    };

    /**
     * Language protection
     * @namespace LanguageProtection
     */
    const LanguageProtection = {
        init() {
            if (!Config.get('protectLanguages')) return;
            
            this.spoofLanguages();
            
            Logger.info('Language protection enabled');
        },
        
        spoofLanguages() {
            Object.defineProperty(navigator, 'language', {
                get: () => 'en-US',
                configurable: true
            });
            
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
                configurable: true
            });
            
            Logger.log('Spoofed languages to en-US');
        }
    };

    /**
     * Plugin enumeration protection
     * @namespace PluginProtection
     */
    const PluginProtection = {
        init() {
            if (!Config.get('protectPlugins')) return;
            
            this.hidePlugins();
            
            Logger.info('Plugin enumeration protection enabled');
        },
        
        hidePlugins() {
            Object.defineProperty(navigator, 'plugins', {
                get: () => [],
                configurable: true
            });
            
            Object.defineProperty(navigator, 'mimeTypes', {
                get: () => [],
                configurable: true
            });
            
            Logger.log('Hidden all plugins');
        }
    };

    /**
     * Stats display (optional)
     * @namespace StatsDisplay
     */
    const StatsDisplay = {
        overlay: null,
        
        init() {
            if (!Config.get('debugMode')) return;
            
            this.createOverlay();
        },
        
        createOverlay() {
            this.overlay = document.createElement('div');
            this.overlay.id = 'anti-fp-stats';
            this.overlay.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.85);
                color: #0ff;
                padding: 10px;
                font-family: monospace;
                font-size: 11px;
                z-index: 999999;
                border-radius: 4px;
                max-width: 250px;
                line-height: 1.4;
            `;
            
            const protections = [];
            if (Config.get('protectCanvas')) protections.push('Canvas');
            if (Config.get('protectWebGL')) protections.push('WebGL');
            if (Config.get('protectAudio')) protections.push('Audio');
            if (Config.get('protectFonts')) protections.push('Fonts');
            if (Config.get('protectScreen')) protections.push('Screen');
            if (Config.get('protectUserAgent')) protections.push('UA');
            if (Config.get('protectWebRTC')) protections.push('WebRTC');
            if (Config.get('protectBattery')) protections.push('Battery');
            if (Config.get('protectHardware')) protections.push('Hardware');
            
            this.overlay.innerHTML = `
                <strong>Anti-Fingerprinting v1.0</strong><br>
                Active: ${protections.join(', ')}<br>
                Noise: ${Config.get('randomizeNoise') ? 'Yes' : 'No'}<br>
                Session: ${Config.get('consistentSession') ? 'Consistent' : 'Random'}
            `;
            
            if (document.body) {
                document.body.appendChild(this.overlay);
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    document.body.appendChild(this.overlay);
                });
            }
        },
        
        destroy() {
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
                GM_registerMenuCommand('🎭 Toggle Canvas Protection', () => {
                    Config.set('protectCanvas', !Config.get('protectCanvas'));
                    location.reload();
                });
                
                GM_registerMenuCommand('🎨 Toggle WebGL Protection', () => {
                    Config.set('protectWebGL', !Config.get('protectWebGL'));
                    location.reload();
                });
                
                GM_registerMenuCommand('🔊 Toggle Audio Protection', () => {
                    Config.set('protectAudio', !Config.get('protectAudio'));
                    location.reload();
                });
                
                GM_registerMenuCommand('🌐 Toggle WebRTC Protection', () => {
                    Config.set('protectWebRTC', !Config.get('protectWebRTC'));
                    location.reload();
                });
                
                GM_registerMenuCommand('🎲 Toggle Noise Randomization', () => {
                    Config.set('randomizeNoise', !Config.get('randomizeNoise'));
                    location.reload();
                });
                
                GM_registerMenuCommand('🐛 Toggle Debug Mode', () => {
                    Config.set('debugMode', !Config.get('debugMode'));
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
            Logger.info('Initializing Anti-Fingerprinting Suite v1.0');
            
            // Initialize configuration
            await Config.init();
            
            // Apply protections BEFORE any page scripts run
            CanvasProtection.init();
            WebGLProtection.init();
            AudioProtection.init();
            FontProtection.init();
            ScreenProtection.init();
            UserAgentProtection.init();
            WebRTCProtection.init();
            BatteryProtection.init();
            HardwareProtection.init();
            TimezoneProtection.init();
            LanguageProtection.init();
            PluginProtection.init();
            
            // Initialize UI when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    StatsDisplay.init();
                });
            } else {
                StatsDisplay.init();
            }
            
            // Initialize menu
            MenuManager.init();
            
            Logger.info('Anti-Fingerprinting Suite initialized ✓');
            Logger.info('Your browser fingerprint is now protected');
        }
    };

    // Auto-initialize
    App.init().catch(e => {
        Logger.error('Initialization failed:', e);
    });

    // Expose API for debugging
    window.AntiFP = {
        version: '1.0',
        config: Config,
        protections: {
            canvas: CanvasProtection,
            webgl: WebGLProtection,
            audio: AudioProtection,
            fonts: FontProtection,
            screen: ScreenProtection,
            userAgent: UserAgentProtection,
            webrtc: WebRTCProtection,
            battery: BatteryProtection,
            hardware: HardwareProtection
        }
    };

})();
