# YouTube 4K HDR Quality Enhancer v2.0 - Quick Start Guide

## What This Script Does

The YouTube 4K HDR Quality Enhancer v2.0 **intercepts and modifies YouTube's player scripts** to force the highest possible video quality, HDR support, and maximum bitrate. Unlike simple quality selectors, this script works at a deep level by:

1. **Intercepting YouTube's initialization scripts** before the page fully loads
2. **Modifying streaming format data** to prioritize 4K/8K HDR content
3. **Forcing VP9 Profile 2 codec** for HDR playback
4. **Preventing quality downgrades** during playback
5. **Overriding adaptive bitrate logic** to maintain maximum quality

## Installation

### Step 1: Install Tampermonkey
- [Tampermonkey for Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Tampermonkey for Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- [Tampermonkey for Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

### Step 2: Install the Script
1. Click the Tampermonkey icon in your browser
2. Select **"Create a new script"**
3. Delete the default template
4. Copy the entire contents of `youtube-4k-enhancer.js` from this repository
5. Paste into the editor
6. Press **Ctrl+S (Cmd+S on Mac)** to save
7. The script is now active!

### Step 3: Verify Installation
1. Open YouTube and play any video
2. Press **F12** to open browser console
3. Look for green **"[YT-4K]"** messages indicating the script is active
4. You should see messages like:
   ```
   [YT-4K] Initializing YouTube script interceptor...
   [YT-4K] Script interceptor active
   [YT-4K] Initializing YouTube 4K HDR Quality Enhancer v2.0
   ```

## Features Explained

### 🔧 Script Interception
The script runs at `document-start` (before page loads) to intercept:
- **ytInitialPlayerResponse**: YouTube's player configuration data
- **Fetch API calls**: Player updates and quality changes
- **XMLHttpRequest calls**: Quality selection requests
- **Window variables**: Global player configuration

### 🎯 Format Prioritization
Automatically sorts available video formats by:
1. **HDR capability** (VP9 Profile 2 codec: vp09.02.*)
2. **Resolution** (4K/8K > 1440p > 1080p)
3. **Bitrate** (highest available)
4. **Frame rate** (60fps > 30fps)

### 🔒 Quality Lock
Prevents YouTube from downgrading quality by:
- Monitoring video dimensions every 5 seconds
- Detecting quality drops
- Automatically restoring maximum quality
- Overriding adaptive bitrate algorithm

### 💎 HDR Enforcement
Forces HDR playback when available:
- Prioritizes VP9 Profile 2 codec (vp09.02.10.08)
- Reports HDR support in MediaCapabilities API
- Configures Widevine DRM for HDR streams
- Detects and enables HDR color space

## Using the Script

### Menu Commands
Click the Tampermonkey icon → YouTube 4K HDR Quality Enhancer → Select command:

- **🔍 Show Debug Info**: Displays detailed format information in console
- **🔄 Reapply Quality Settings**: Manually forces highest quality
- **⚙️ Toggle Debug Mode**: Shows real-time stats overlay (reload required)
- **🎬 Toggle HDR**: Enable/disable HDR enforcement (reload required)
- **🚀 Toggle Hardware Acceleration**: GPU acceleration (reload required)
- **📊 Toggle High FPS**: 60fps preference (reload required)

### Debug Information
To see what formats are available and what the script is doing:

1. Open browser console (F12)
2. Click Tampermonkey icon → "Show Debug Info"
3. Or type in console: `window.YT4KEnhancer.debugInfo()`

This will display:
- Current configuration
- Available video formats with resolution, codec, and bitrate
- Top 10 adaptive formats sorted by quality
- HDR format detection

### Example Debug Output
```javascript
YT4KEnhancer Debug Info:
Config: {preferredQuality: "2160p", preferHDR: true, ...}
Available Formats: ["2160p @ 35000kbps", "1440p @ 24000kbps", ...]
Adaptive Formats: [
  {quality: "2160p", codec: "video/webm; codecs=vp09.02.10.08", bitrate: "15000kbps", fps: 60},
  {quality: "2160p", codec: "video/webm; codecs=vp9", bitrate: "12000kbps", fps: 60},
  ...
]
```

## Understanding Video Codecs

### VP9 Profile 2 (HDR)
- **Codec string**: `vp09.02.*` (e.g., `vp09.02.10.08`)
- **Color space**: BT.2020 with HLG or PQ transfer
- **Requires**: HDR-capable display and GPU with VP9 Profile 2 support

### VP9 Profile 0 (SDR)
- **Codec string**: `vp09.00.*` or just `vp9`
- **Color space**: BT.709 (standard)
- **Widely supported**: Most modern GPUs

### AVC/H.264
- **Codec string**: `avc1.*`
- **Fallback codec**: Used when VP9 not available
- **Lower quality**: At same bitrate compared to VP9

## Requirements for HDR

To get HDR playback, you need:

### Display
- ✅ HDR10-compatible monitor or TV
- ✅ HDR enabled in Windows/Mac display settings
- ✅ Connected via HDMI 2.0+ or DisplayPort 1.4+

### Browser
- ✅ Chrome or Edge (recommended)
- ✅ Hardware acceleration enabled
- ⚠️ Firefox has limited HDR support

### GPU
- ✅ VP9 Profile 2 hardware decoding support
- ✅ NVIDIA GTX 1050+ / AMD RX 400+ / Intel Gen 9+
- ✅ Latest GPU drivers installed

### Connection
- ✅ Minimum 25Mbps for 4K HDR
- ✅ Recommended 50Mbps+ for stable playback

## Troubleshooting

### Script Not Working?

**Check script is active:**
```javascript
// In console (F12):
window.YT4KEnhancer
// Should show: {version: "2.0", config: {...}, ...}
```

**Verify interception:**
```javascript
// In console:
window.ytInitialPlayerResponse
// Should show YouTube's player data
```

**Force reload:**
- Press Ctrl+Shift+R (Cmd+Shift+R on Mac) for hard refresh
- Clears cache and reinitializes script

### Still Not 4K?

1. **Check available formats:**
   ```javascript
   window.YT4KEnhancer.debugInfo()
   ```
   Look for "2160p" in the format list

2. **Some videos don't have 4K:**
   - Older videos may only have 1080p max
   - Live streams may have limited quality
   - Creator may not have uploaded in 4K

3. **Manually reapply:**
   - Tampermonkey → "Reapply Quality Settings"
   - Or in console: `window.YT4KEnhancer.reapply()`

### No HDR?

1. **Check for HDR formats:**
   ```javascript
   window.YT4KEnhancer.debugInfo()
   ```
   Look for "vp09.02" in codec names

2. **Verify HDR support:**
   - Windows: Settings → Display → HDR (should be ON)
   - macOS: System Preferences → Displays → check HDR capability
   - Use Chrome/Edge (better HDR support)

3. **Not all videos have HDR:**
   - Creator must upload HDR version
   - Look for "HDR" badge on video player

### Performance Issues?

**4K stuttering:**
- Lower quality to 1440p: Edit script, change `preferredQuality: '1440p'`
- Close other tabs/applications
- Check GPU usage (should show hardware decoding)

**High CPU usage:**
- Disable debug mode (reduces logging overhead)
- Ensure hardware acceleration is enabled in browser

**High bandwidth usage:**
- 4K HDR uses 15-50 Mbps constantly
- Consider capping quality if on metered connection

## Advanced Configuration

Edit the script to customize behavior:

```javascript
const Config = {
    defaults: {
        preferredQuality: '2160p',    // '4320p', '2160p', '1440p', '1080p'
        preferHDR: true,              // Force HDR when available
        preferHighFPS: true,          // Prefer 60fps over 30fps
        forceHWAccel: true,           // Force GPU acceleration
        codecPreference: 'vp9',       // 'vp9' or 'avc'
        audioQuality: 'high',         // Audio bitrate preference
        bufferSize: 'large',          // Buffer size for streaming
        debugMode: false              // Show stats overlay
    }
};
```

## How Script Interception Works

### Initialization Flow
```
1. Script loads at document-start
   ↓
2. Intercepts appendChild/insertBefore
   ↓
3. Captures ytInitialPlayerResponse scripts
   ↓
4. Modifies inline JavaScript to sort formats
   ↓
5. Hooks Fetch/XHR for API calls
   ↓
6. Sets up quality monitoring
   ↓
7. Applies hardware acceleration
```

### Quality Enforcement
```
Video loads → Check quality → Is it 4K?
              ↓                    ↓
              Yes                  No
              ↓                    ↓
         Monitor every 5s    Force upgrade
              ↓                    ↓
         Degraded? ───────> Restore 4K
```

## FAQ

**Q: Will this work on all videos?**
A: Only videos that have 4K/HDR versions uploaded by the creator.

**Q: Does this increase bandwidth usage?**
A: Yes, significantly. 4K HDR uses 15-50 Mbps vs 5-10 Mbps for 1080p.

**Q: Can I use this with YouTube Premium?**
A: Yes! Works with Premium and can access Premium bitrate streams.

**Q: Will this drain my battery faster?**
A: Yes, 4K HDR playback is power-intensive. Not recommended on battery.

**Q: Is this against YouTube's terms of service?**
A: This script only modifies client-side quality selection, not bypassing restrictions.

**Q: Can I use this on mobile?**
A: Only on browsers that support userscripts (e.g., Firefox with Tampermonkey on Android).

## Technical Details

### Interception Points

1. **Script Injection**
   - Monitors `Element.prototype.appendChild`
   - Modifies inline scripts containing `ytInitialPlayerResponse`

2. **Window Variables**
   - Intercepts `window.ytInitialPlayerResponse` with getter/setter
   - Intercepts `window.ytInitialData` for initial page data

3. **Network Requests**
   - Overrides `window.fetch` for player API calls
   - Hooks `XMLHttpRequest.prototype.open/send`

4. **Player Configuration**
   - Intercepts `window.ytplayer` config object
   - Overrides `setPlaybackQuality` methods

### Format Selection Algorithm

```javascript
formats.sort((a, b) => {
    // 1. Prioritize HDR
    const aHDR = a.mimeType.includes('vp09.02') ? 1000000 : 0;
    const bHDR = b.mimeType.includes('vp09.02') ? 1000000 : 0;
    if (aHDR !== bHDR) return bHDR - aHDR;
    
    // 2. Sort by resolution
    const aHeight = parseInt(a.height || 0);
    const bHeight = parseInt(b.height || 0);
    if (aHeight !== bHeight) return bHeight - aHeight;
    
    // 3. Sort by bitrate
    const aBitrate = parseInt(a.bitrate || 0);
    const bBitrate = parseInt(b.bitrate || 0);
    return bBitrate - aBitrate;
});
```

## Support

For issues or questions:
- Open an issue on GitHub: https://github.com/RyAnPr1Me/webperf/issues
- Include console output (F12) with "[YT-4K]" messages
- Specify browser, OS, and GPU information

## License

MIT License - See repository for details.

---

**Enjoy your enhanced YouTube experience! 🎬✨**
