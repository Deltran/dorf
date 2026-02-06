# Dorf Release Process

## Files to Update

1. **`version.txt`** (repo root) — The version the app checks against. Single line, e.g. `1.1.0`

2. **`changelog.txt`** (repo root) — Shown to users when an update is available. Newest version at top:
   ```
   1.1.0
   - Added settings screen with update checker
   - Battle animation improvements

   1.0.0
   - Initial release
   ```

3. **`src/config.js`** — `APP_VERSION` must match `version.txt`:
   ```js
   export const APP_VERSION = '1.1.0'
   ```

## Steps

1. Bump version in all three files (version.txt, changelog.txt, src/config.js)
2. Build the APK: `npx cap sync android` then build in Android Studio
3. Upload APK to Google Drive (overwrite the existing file — keeps the same link)
4. Commit and push:
   ```
   git add version.txt changelog.txt src/config.js
   git commit -m "release 1.1.0"
   git push
   ```

The push makes it live — the app reads version.txt and changelog.txt from `raw.githubusercontent.com/Deltran/dorf/main/`.

## How It Works

- `src/config.js` has the baked-in `APP_VERSION` plus URLs to the raw GitHub files
- Settings screen fetches `version.txt`, compares semver to `APP_VERSION`
- If newer version exists, shows "Update available" banner with changelog and APK download button
- APK download link points to Google Drive (stable file ID since you overwrite the same file)

## Versioning

Semver format: `major.minor.patch`
- **patch** (1.0.0 → 1.0.1): bug fixes
- **minor** (1.0.0 → 1.1.0): new features
- **major** (1.0.0 → 2.0.0): big milestones
