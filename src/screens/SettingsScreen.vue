<script setup>
import { ref } from 'vue'
import { APP_VERSION, VERSION_CHECK_URL, APK_DOWNLOAD_URL, CHANGELOG_URL } from '../config.js'

const emit = defineEmits(['navigate', 'back'])

const checkState = ref('idle') // 'idle' | 'checking' | 'up-to-date' | 'update-available' | 'error'
const remoteVersion = ref(null)
const errorMessage = ref(null)
const changelog = ref(null)

function isNewerVersion(remote, local) {
  const r = remote.split('.').map(Number)
  const l = local.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (l[i] || 0)) return true
    if ((r[i] || 0) < (l[i] || 0)) return false
  }
  return false
}

async function checkForUpdate() {
  checkState.value = 'checking'
  errorMessage.value = null

  try {
    const response = await fetch(VERSION_CHECK_URL)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const text = (await response.text()).trim()

    // Validate it looks like a version string
    if (!/^\d+\.\d+\.\d+$/.test(text)) {
      throw new Error('Invalid version format')
    }

    remoteVersion.value = text

    if (isNewerVersion(text, APP_VERSION)) {
      checkState.value = 'update-available'
      // Fetch changelog (non-blocking — don't fail the update check if this errors)
      fetchChangelog()
    } else {
      checkState.value = 'up-to-date'
    }
  } catch (e) {
    checkState.value = 'error'
    errorMessage.value = 'Could not check for updates'
  }
}

async function fetchChangelog() {
  try {
    const response = await fetch(CHANGELOG_URL)
    if (!response.ok) return
    const text = (await response.text()).trim()
    if (text) changelog.value = text
  } catch {
    // Silently fail — changelog is optional
  }
}

function downloadApk() {
  window.open(APK_DOWNLOAD_URL, '_blank')
}
</script>

<template>
  <div class="settings-screen">
    <div class="bg-vignette"></div>
    <header class="settings-header">
      <button class="back-btn" @click="emit('back')">‹</button>
      <h1 class="header-title">Settings</h1>
      <div class="spacer"></div>
    </header>

    <div class="settings-content">
      <!-- Version & Update Section -->
      <div class="settings-section">
        <div class="section-label">App Version</div>
        <div class="version-row">
          <span class="version-number">v{{ APP_VERSION }}</span>
          <button
            v-if="checkState === 'idle' || checkState === 'error'"
            class="check-btn"
            @click="checkForUpdate"
          >
            Check for Update
          </button>
          <span v-else-if="checkState === 'checking'" class="check-status checking">
            Checking...
          </span>
          <span v-else-if="checkState === 'up-to-date'" class="check-status up-to-date">
            Up to date
          </span>
        </div>

        <div v-if="checkState === 'error' && errorMessage" class="error-msg">
          {{ errorMessage }}
        </div>

        <div v-if="checkState === 'update-available'" class="update-banner">
          <div class="update-header">
            <div class="update-text">
              Update available: <strong>v{{ remoteVersion }}</strong>
            </div>
            <button class="download-btn" @click="downloadApk">
              Download APK
            </button>
          </div>
          <div v-if="changelog" class="changelog">
            <div class="changelog-label">What's new</div>
            <pre class="changelog-text">{{ changelog }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-screen {
  min-height: 100vh;
  background: linear-gradient(to bottom, #0a0a0a 0%, #111827 100%);
  padding: 20px;
  padding-top: calc(20px + var(--safe-area-top));
  position: relative;
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.8) 100%);
  pointer-events: none;
  z-index: 0;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.back-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.8rem;
  cursor: pointer;
  padding: 0 8px;
  line-height: 1;
}

.header-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.spacer {
  flex: 1;
}

.settings-content {
  position: relative;
  z-index: 1;
}

/* Section */
.settings-section {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 10px;
  padding: 16px;
}

.section-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.version-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.version-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
  font-variant-numeric: tabular-nums;
}

.check-btn {
  background: rgba(55, 65, 81, 0.8);
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #d1d5db;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 6px 14px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.check-btn:hover {
  background: rgba(75, 85, 99, 0.8);
  border-color: #6b7280;
}

.check-status {
  font-size: 0.8rem;
  font-weight: 500;
}

.check-status.checking {
  color: #9ca3af;
}

.check-status.up-to-date {
  color: #22c55e;
}

.error-msg {
  margin-top: 8px;
  font-size: 0.75rem;
  color: #ef4444;
}

/* Update banner */
.update-banner {
  margin-top: 14px;
  padding: 14px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
}

.update-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.update-text {
  font-size: 0.85rem;
  color: #fcd34d;
}

.update-text strong {
  color: #f59e0b;
}

.download-btn {
  background: linear-gradient(180deg, #b45309 0%, #92400e 100%);
  border: 1px solid #d97706;
  border-radius: 6px;
  color: #fef3c7;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 8px 16px;
  cursor: pointer;
  white-space: nowrap;
  transition: filter 0.15s ease;
}

.download-btn:hover {
  filter: brightness(1.15);
}

/* Changelog */
.changelog {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(245, 158, 11, 0.15);
}

.changelog-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.changelog-text {
  font-family: inherit;
  font-size: 0.8rem;
  line-height: 1.5;
  color: #d1d5db;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
