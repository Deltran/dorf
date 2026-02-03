import { ref } from 'vue'

/**
 * Composable for detecting long-press (hold) gestures
 * Supports both touch and mouse for mobile and desktop testing
 *
 * @param {Function} callback - Called when long-press is detected
 * @param {number} duration - Hold duration in ms (default 500)
 * @returns {Object} Event handlers to bind to the element
 */
export function useLongPress(callback, duration = 500) {
  let timer = null
  let startX = 0
  let startY = 0
  const MOVE_THRESHOLD = 10 // pixels - cancel if finger moves too much

  const isPressed = ref(false)

  function start(x, y) {
    startX = x
    startY = y
    isPressed.value = true

    timer = setTimeout(() => {
      if (isPressed.value) {
        callback()
      }
      cleanup()
    }, duration)
  }

  function cleanup() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    isPressed.value = false
  }

  function checkMove(x, y) {
    const dx = Math.abs(x - startX)
    const dy = Math.abs(y - startY)
    if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
      cleanup()
    }
  }

  // Touch handlers
  function onTouchStart(event) {
    const touch = event.touches[0]
    start(touch.clientX, touch.clientY)
  }

  function onTouchMove(event) {
    if (!isPressed.value) return
    const touch = event.touches[0]
    checkMove(touch.clientX, touch.clientY)
  }

  function onTouchEnd() {
    cleanup()
  }

  // Mouse handlers (for desktop testing)
  function onMouseDown(event) {
    // Only left click
    if (event.button !== 0) return
    start(event.clientX, event.clientY)
  }

  function onMouseMove(event) {
    if (!isPressed.value) return
    checkMove(event.clientX, event.clientY)
  }

  function onMouseUp() {
    cleanup()
  }

  function onMouseLeave() {
    cleanup()
  }

  return {
    isPressed,
    // Touch events
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    // Mouse events
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave
  }
}
