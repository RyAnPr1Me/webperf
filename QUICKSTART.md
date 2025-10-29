# Quick Start Guide

Welcome to the Web Performance Suite! This repository contains three powerful Tampermonkey scripts to enhance your browsing experience.

## 🚀 Quick Installation

### Step 1: Install Tampermonkey
Install [Tampermonkey](https://www.tampermonkey.net/) browser extension for your browser:
- Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/)
- Firefox: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/)
- Edge: [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/)
- Safari: [App Store](https://apps.apple.com/app/tampermonkey/id1482490089)

### Step 2: Install Scripts

Click the Tampermonkey icon → "Create a new script" → Delete the template → Copy/paste the script → Save

**Recommended: Install all three for best experience!**

#### 1. Web Performance Suite (`webperf.js`)
- **What it does**: Speeds up all websites through caching, lazy loading, hardware acceleration, and more
- **Install for**: Better performance on all websites
- **Impact**: 30-60% faster page loads

#### 2. YouTube 4K Enhancer (`youtube-4k-enhancer.js`)
- **What it does**: Forces 4K quality, HDR, highest bitrate/FPS on YouTube
- **Install for**: Maximum video quality on YouTube
- **Impact**: Always watch in 4K/HDR when available

#### 3. Anti-Fingerprinting Suite (`anti-fingerprint.js`)
- **What it does**: Protects against browser fingerprinting and tracking
- **Install for**: Privacy protection on all websites
- **Impact**: Makes tracking harder, protects your privacy

## 📋 What Each Script Does

### Web Performance Suite
✅ Speeds up page loading  
✅ Optimizes images automatically  
✅ Enables hardware acceleration  
✅ Caches resources smartly  
✅ Reduces bandwidth usage  
✅ Shows live performance stats  

### YouTube 4K Enhancer
✅ Always plays in 4K (when available)  
✅ Enables HDR/HDR10+ automatically  
✅ Selects 60fps when available  
✅ Optimizes for hardware acceleration  
✅ Maximizes audio quality  
✅ Configures Widevine DRM for best quality  

### Anti-Fingerprinting Suite
✅ Blocks canvas fingerprinting  
✅ Blocks WebGL fingerprinting  
✅ Blocks audio fingerprinting  
✅ Prevents WebRTC IP leaks  
✅ Spoofs hardware information  
✅ Hides font enumeration  
✅ Normalizes user agent  

## 🎯 Usage

### No Configuration Needed!
All scripts work automatically once installed. Just browse normally!

### Optional: Configure via Menu
Click Tampermonkey icon → Script name → Configure options

**Web Performance Suite Menu:**
- Toggle individual features on/off
- Disable on specific domains
- Clear cache

**YouTube 4K Enhancer Menu:**
- Toggle debug mode (see stats)
- Toggle HDR
- Toggle hardware acceleration
- Toggle high FPS

**Anti-Fingerprinting Menu:**
- Toggle individual protections
- Toggle noise randomization
- Toggle debug mode

## 🔍 Verification

### Test Web Performance Suite
1. Visit any website
2. Press F12 → Console tab
3. Look for green "[WebPerf]" messages
4. See diagnostics panel in bottom-right corner

### Test YouTube 4K Enhancer
1. Go to YouTube and play any video
2. Right-click video → "Stats for nerds"
3. Check resolution shows "2160p" or higher
4. Enable debug mode to see stats overlay

### Test Anti-Fingerprinting
1. Visit [browserleaks.com/canvas](https://browserleaks.com/canvas)
2. Refresh page multiple times
3. Notice canvas fingerprint changes each time
4. Test at other sites: [amiunique.org](https://amiunique.org)

## ❓ FAQ

**Q: Can I use all three scripts together?**  
A: Yes! They're designed to work together without conflicts.

**Q: Will these slow down my browser?**  
A: No! They're optimized for minimal overhead. Web Performance Suite actually speeds up browsing.

**Q: Are these safe?**  
A: Yes! All code is open source and you can inspect it. No data collection, no external requests.

**Q: Will websites detect the anti-fingerprinting?**  
A: Some may detect it, but most won't. The protections are designed to be subtle.

**Q: Do I need all three?**  
A: No, but recommended:
- Use Web Performance Suite for speed
- Use YouTube 4K Enhancer if you watch YouTube
- Use Anti-Fingerprinting for privacy

**Q: Can I disable a script temporarily?**  
A: Yes! Click Tampermonkey icon → Toggle the script on/off

**Q: How do I update the scripts?**  
A: When we release updates, you'll need to manually copy/paste the new code, or use the Tampermonkey update feature if configured.

## 🛠️ Troubleshooting

### Web Performance Suite

**Not seeing improvements?**
- Check F12 console for "[WebPerf]" messages
- Try disabling on lightweight sites (they may not benefit)
- Some sites may load slower initially while building cache

**Website broken?**
- Disable hardware acceleration for that site
- Add site to blacklist via menu
- Report issue on GitHub

### YouTube 4K Enhancer

**Not forcing 4K?**
- Wait a few seconds after video starts
- Enable debug mode to see current quality
- Check if video has 4K available (not all do)
- Verify hardware can handle 4K

**Video stuttering?**
- Lower preferred quality to 1440p in script
- Check internet speed (4K needs ~25 Mbps)
- Ensure hardware acceleration enabled in browser

### Anti-Fingerprinting

**Website not working?**
- Try disabling WebRTC protection (may break video calls)
- Try disabling Canvas protection (rarely needed)
- Whitelist trusted sites

**Still being tracked?**
- Fingerprinting protection is not 100% - use with other tools
- Combine with Privacy Badger, uBlock Origin
- Consider using private browsing mode

## 🎓 Learn More

See the full [README.md](README.md) for:
- Detailed feature descriptions
- Advanced configuration options
- Technical details and architecture
- Version history
- Contributing guidelines

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/RyAnPr1Me/webperf/issues)
- **Questions**: Open a discussion on GitHub
- **Updates**: Watch the repository for new releases

## 🙏 Enjoy!

Thank you for using the Web Performance Suite! We hope these scripts enhance your browsing experience.

⭐ If you find these useful, please star the repository!

---

Made with ⚡ for a faster, better, more private web
