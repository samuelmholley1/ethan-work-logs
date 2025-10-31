# PWA Installation Guide - Ethan Work Logger

Your app is now a **Progressive Web App (PWA)** and can be installed on both iOS and Android devices like a native app!

## 🍎 iPhone & iPad (iOS)

### How to Install

1. **Open in Safari**
   - Visit: `https://ethan-work-logs.samuelholley.com`
   - (Note: iOS Safari is required; other browsers may not support PWA installation)

2. **Share & Add to Home Screen**
   - Tap the **Share** button (square with arrow)
   - Scroll down and tap **"Add to Home Screen"**
   - Name: "Work Logger" (or keep the default)
   - Tap **Add**

3. **Launch**
   - The app now appears on your home screen
   - Tap to open - it runs in full-screen mode!

### Features on iOS

✅ **Full-screen app** - No browser toolbar, looks like a native app  
✅ **Splash screen** - Shows app icon when launching  
✅ **Status bar** - Styled with semi-transparent black  
✅ **Offline support** - Service worker caches critical assets  
✅ **Persistent data** - Your time logs persist across sessions  
✅ **App icon** - Green icon with "WL" on home screen  

### Troubleshooting iOS

- **"Add to Home Screen" not showing?**
  - Make sure you're using **Safari** (not Chrome, Firefox, etc.)
  - iOS 15.1+ required
  - Clear browser cache: Settings → Safari → Clear History and Website Data
  - Try again

- **App won't open?**
  - Delete the app from home screen
  - Close Safari completely
  - Force quit Safari: Swipe up from bottom or use multitasking
  - Clear cache and try again

---

## 🤖 Android (Chrome)

### How to Install

#### Option A: Automatic Install Prompt (Easiest)

1. **Open in Chrome**
   - Visit: `https://ethan-work-logs.samuelholley.com`
   - Use **Chrome** or Chromium-based browsers (Edge, Brave, etc.)

2. **Install Prompt**
   - An install prompt will appear in the address bar or as a pop-up
   - Or look for an **install button** (⬇️ icon) in the address bar
   - Tap **Install**
   - The app installs to your home screen

#### Option B: Manual Install (Chrome Menu)

1. **Open in Chrome**
   - Visit: `https://ethan-work-logs.samuelholley.com`

2. **Menu → Install App**
   - Tap the **three dots** (⋮) menu
   - Select **"Install app"** or **"Add to Home Screen"**
   - Confirm

3. **Done!**
   - Green app icon appears on home screen

### Features on Android

✅ **Full-screen app** - No browser toolbar  
✅ **Install prompt** - Chrome will prompt you to install  
✅ **Offline support** - Service worker caches assets  
✅ **Data persistence** - Logs saved locally  
✅ **App shortcuts** - Long-press to see quick actions  
✅ **Theme color** - Green theme in browser chrome  

### Troubleshooting Android

- **Install button not showing?**
  - Make sure you're using **Chrome** or Chromium browser
  - Android 5.0+ (Chrome 42+) required
  - Clear app cache: Settings → Apps → Chrome → Storage → Clear Cache
  - Refresh the page (F5 or pull-to-refresh)

- **"Add to Home Screen" greyed out?**
  - Wait a moment - PWA criteria must be met
  - Ensure you're online
  - Try from a different browser tab

- **App won't stay installed?**
  - Check if device is low on storage
  - Uninstall and reinstall
  - Make sure you're using Chrome/Chromium

---

## ✅ What Works Offline

Once installed, your app works offline for:

✅ **View past work logs** - Locally stored data persists  
✅ **Offline-first timer** - Clock in/out works offline  
✅ **Data saves locally** - Automatic sync when online  
✅ **Static assets load** - All CSS, fonts, images cached  

❌ **Sync to cloud** - Requires internet (will sync when back online)  
❌ **New data creation** - Some features require connection  

---

## 🔄 Keep Your App Updated

The app automatically checks for updates when you open it. To get the latest version:

1. **Force refresh** the app
2. **iOS**: Swipe down or use Settings → General → Refresh
3. **Android**: Pull down or use Chrome menu → Refresh

---

## 📊 Technical Details

| Aspect | Details |
|--------|---------|
| **PWA Type** | Standalone Web App |
| **Manifest** | `/site.webmanifest` |
| **Service Worker** | `/sw.js` |
| **Theme Color** | #059669 (Green) |
| **Start URL** | `/` |
| **Display Mode** | Standalone (no browser UI) |
| **Orientation** | Portrait |

### Icon Sizes

- **16×16, 32×32** - Favicon for browsers
- **192×192, 512×512** - Android app icons
- **180×180** - Apple touch icon

---

## 🚀 Tips & Tricks

### iPhone
- **Organize**: Create a folder on home screen for Work Logger
- **Customize**: Long-press icon → Edit App Icon (change color if desired)
- **Share**: You can share the shortcut with others via AirDrop

### Android
- **Pin to notification**: Long-press app → Pin to notification
- **Quick access**: Add widget to home screen (if available)
- **Share**: Share install link via messaging apps

---

## 🆘 Still Having Issues?

1. **Clear all data**
   - Uninstall the app
   - Clear browser cache completely
   - Reinstall

2. **Check browser console** for errors
   - iOS: Settings → Safari → Advanced → Web Inspector
   - Android: Chrome → DevTools (chrome://inspect)

3. **Network requirements**
   - Install works best on WiFi
   - Ensure HTTPS connection (not HTTP)

4. **Contact support**
   - Check browser console for error messages
   - Note your device model and OS version

---

## 📝 What Happens When You Update Your App?

1. **New code is deployed** to the server
2. **Service worker checks** for updates in background
3. **Next time you open the app**, it notifies you
4. **Refresh to update** to the latest version

The update happens seamlessly without disrupting your work!

---

**Happy tracking! 🎯**

Your Ethan Work Logger is now on your home screen and works offline. Clock in, log events, and track behavioral data - even without internet!
