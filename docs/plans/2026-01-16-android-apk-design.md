# Android APK Distribution - Design Document

## Overview

Package Dorf as a standalone Android APK using Capacitor, distributed via direct download (GitHub releases, itch.io, etc.). The game runs fully offline with optional server time checks for features like daily rewards.

## Goals

- Distribute as downloadable APK (no app store)
- Full offline gameplay
- Optional online time verification to prevent clock manipulation
- CLI-based build process using Gradle (no Android Studio required)

## Approach: Capacitor

Capacitor wraps the Vue app in a native Android WebView, producing a standard APK. The existing codebase stays unchanged - Capacitor provides the native shell.

**What gets added:**

```
/android/                 ← Generated Android project (Gradle-based)
capacitor.config.ts       ← Capacitor settings
dorf-release.keystore     ← Signing key (not committed to git)
```

## Setup

### Install Dependencies

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Capacitor Config

Create `capacitor.config.ts` in project root:

```ts
import type { CapacitorConfig } from '@capacitor/core'

const config: CapacitorConfig = {
  appId: 'com.yourname.dorf',
  appName: 'Dorf',
  webDir: 'dist',
  server: {
    // No URL = fully offline, assets bundled in APK
  }
}

export default config
```

### Initialize Android Project

```bash
npx cap add android
```

This creates the `/android` folder - a standard Gradle project.

## Build Process

### Package Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "build:android": "npm run build && npx cap sync android"
  }
}
```

### Debug Build

```bash
npm run build:android
cd android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build

Release builds are smaller and optimized but require signing.

**Generate keystore (once):**

```bash
keytool -genkey -v -keystore dorf-release.keystore -alias dorf -keyalg RSA -keysize 2048 -validity 10000
```

Keep this keystore safe - you need it for all future updates. Do not commit to git.

**Configure signing in `android/app/build.gradle`:**

Add inside `android { }` block:

```groovy
signingConfigs {
    release {
        storeFile file('../../dorf-release.keystore')
        storePassword System.getenv('KEYSTORE_PASSWORD') ?: ''
        keyAlias 'dorf'
        keyPassword System.getenv('KEY_PASSWORD') ?: ''
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

**Build release APK:**

```bash
export KEYSTORE_PASSWORD="your-password"
export KEY_PASSWORD="your-password"
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

## Server Time Check

For verifying real-world time without hosting your own server:

### Time Utility

Create `src/utils/serverTime.js`:

```js
let cachedOffset = 0

export async function initServerTime() {
  try {
    const response = await fetch('https://worldtimeapi.org/api/ip')
    const data = await response.json()
    const serverTime = new Date(data.utc_datetime).getTime()
    cachedOffset = serverTime - Date.now()
  } catch {
    // Offline - use device time (offset stays 0)
    cachedOffset = 0
  }
}

export function getServerTime() {
  return new Date(Date.now() + cachedOffset)
}

export function isOnline() {
  return navigator.onLine
}
```

### Usage

Call `initServerTime()` once at app startup (e.g., in `App.vue` mounted hook or main.js):

```js
import { initServerTime } from './utils/serverTime'

// On app start
await initServerTime()
```

Use `getServerTime()` for time-sensitive features:

```js
import { getServerTime } from './utils/serverTime'

function canClaimDailyReward(lastClaim) {
  const now = getServerTime()
  const lastClaimDate = new Date(lastClaim).toDateString()
  const todayDate = now.toDateString()
  return lastClaimDate !== todayDate
}
```

### Limitations

- WorldTimeAPI: Free, no key needed, ~1 request/second rate limit
- Offline players can manipulate device time (unavoidable without your own server)
- Consider this acceptable for a single-player gacha game

## Distribution

### Direct Download Options

- **GitHub Releases** - Attach APK to tagged releases
- **itch.io** - Supports Android APK uploads
- **Personal site** - Direct download link

### User Installation

Users must enable "Install from unknown sources" in Android settings, then open the downloaded APK.

### Updates

No automatic updates with direct distribution. Options:

- Manual: Users download new APK and install over existing
- In-app check: Fetch version from a URL, prompt user to download if newer

## Files to Gitignore

Add to `.gitignore`:

```
# Android build artifacts
/android/app/build/
/android/.gradle/
*.keystore

# Local Capacitor config (if using environment-specific settings)
capacitor.config.local.ts
```

## Files to Commit

- `/android/` folder (except build artifacts)
- `capacitor.config.ts`

## Prerequisites

Building requires:

- **Java JDK 17+** - For Gradle
- **Android SDK** - Command-line tools, platform 33+, build-tools

Can install via Android Studio (then use CLI only) or via `sdkmanager` directly.
