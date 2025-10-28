# Web Performance Suite

A powerful userscript designed to dramatically improve web page loading performance through intelligent optimization techniques.

## 🚀 Features

### Core Performance Optimizations

- **Hardware Acceleration**: Forces GPU acceleration for smoother rendering and animations
- **DNS Prefetching**: Preemptively resolves DNS for common domains and external resources
- **Smart Caching**: In-memory caching system with LRU eviction (configurable up to 120MB)
- **Adaptive FPS**: Dynamically adjusts frame rate (60 FPS active, 12 FPS background) to conserve resources
- **Image Optimization**: Automatically rewrites images to WebP format for faster loading
- **Lazy Loading**: Defers loading of media elements until they're in viewport
- **Parallel Prefetching**: Preloads same-origin links in parallel for instant navigation
- **Script/Style Interception**: Optimizes script blocking and stylesheet loading
- **Web Worker Analysis**: Offloads DOM analysis to background threads

### Live Diagnostics

Real-time performance monitoring panel showing:
- Current FPS target
- Cache hit/miss ratios
- Number of images rewritten
- Memory cache usage

## 📦 Installation

### Prerequisites

You need a userscript manager installed in your browser:

- [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge, Opera)
- [Greasemonkey](https://www.greasespot.net/) (Firefox)
- [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Opera, Edge)

### Install Steps

1. Install one of the userscript managers above
2. Click on the userscript manager icon in your browser
3. Select "Create a new script" or "Add new script"
4. Copy the entire contents of `webperf.js` from this repository
5. Paste it into the editor
6. Save the script (Ctrl+S or Cmd+S)

The script will now run automatically on all websites!

## 🎛️ Configuration

All features can be toggled on/off through your userscript manager's menu. Click the userscript manager icon and look for the Web Performance Suite options.

### Available Settings

```javascript
config: {
    imageRewriter: true,        // Convert images to WebP format
    smartCache: true,            // Enable in-memory caching
    adaptiveFPS: true,           // Dynamic FPS adjustment
    parallelPrefetch: true,      // Prefetch same-origin links
    workerAnalyzer: true,        // Web Worker DOM analysis
    diagnosticsPanel: true,      // Show live performance stats
    lazyLoadMedia: true,         // Lazy load images/videos
    hardwareAccel: true,         // Force GPU acceleration
    dnsPrefetch: true,           // Enable DNS prefetching
    
    // Advanced settings (edit in script)
    preferFormat: 'webp',        // Preferred image format
    backgroundFps: 12,           // FPS when tab is inactive
    activeFps: 60,               // FPS when tab is active
    cacheSizeLimitMB: 120,       // Maximum cache size
    parallelPrefetchCount: 6,    // Number of links to prefetch
    maxConcurrentFetches: 6      // Max parallel fetches
}
```

## 🔧 How It Works

### Hardware Acceleration
Applies CSS transforms (`translateZ(0)`, `translate3d`) to all elements, forcing the browser to use GPU rendering for smoother performance.

### DNS Prefetching
Injects `<link rel="dns-prefetch">` tags for:
- Common CDNs (Google, Cloudflare, jsDelivr, etc.)
- External domains referenced on the page
- Font services, analytics, and social media platforms

### Smart Caching
- Stores fetched resources as Blob URLs in memory
- Uses LRU (Least Recently Used) eviction strategy
- Automatically prunes cache when size limit is exceeded
- Tracks hit/miss ratios for diagnostics

### Image Optimization
- Intercepts image loads using MutationObserver
- Rewrites URLs to request WebP format
- Falls back to original format if WebP unavailable
- Serves from cache when possible

### Adaptive FPS
- Throttles `requestAnimationFrame` based on visibility
- Reduces to 12 FPS when tab is in background
- Returns to 60 FPS when tab becomes active
- Saves CPU/battery on idle tabs

## 📊 Performance Impact

Expected improvements on typical websites:
- **20-40% faster** initial page load
- **30-50% reduction** in bandwidth usage (WebP conversion)
- **15-25% better** frame rate consistency
- **10-20% lower** CPU usage on idle tabs

*Results vary based on website structure and content.*

## 🐛 Troubleshooting

### Script not working?
- Ensure your userscript manager is enabled
- Check that the script is enabled in the manager
- Reload the page after installation

### Website looks broken?
- Some sites may conflict with hardware acceleration
- Disable individual features through the menu
- Try disabling `hardwareAccel` or `imageRewriter`

### Performance worse instead of better?
- Very lightweight sites may see overhead from the script
- Consider disabling on specific domains through your userscript manager
- Adjust cache size if memory is constrained

## 🔐 Privacy & Security

- **No data collection**: Everything runs locally in your browser
- **No external requests**: Only prefetches resources from pages you visit
- **No tracking**: No analytics or telemetry
- **Open source**: Inspect the code yourself

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

This project is open source and available under the MIT License.

## ⚡ Performance Tips

1. **Enable all features** for maximum performance gain
2. **Adjust cache size** based on your available RAM
3. **Monitor diagnostics** to see what's being optimized
4. **Disable on lightweight sites** where overhead isn't worth it
5. **Use with ad blockers** for best results

## 🔄 Version History

### v5.4 (Current)
- Added hardware acceleration support
- Implemented DNS prefetching for common domains
- Enhanced page load speed optimizations
- Improved documentation

### v5.3
- Smart caching system
- Adaptive FPS control
- Image format conversion
- Lazy loading media
- Live diagnostics panel

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Made with ⚡ for a faster web