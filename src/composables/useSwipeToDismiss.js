import { ref, onMounted, onUnmounted, watch } from 'vue'

/**
 * Composable for swipe-down-to-dismiss on bottom sheets
 * @param {Object} options
 * @param {Ref<HTMLElement>} options.elementRef - Ref to the drawer element
 * @param {Ref<boolean>} options.isOpen - Ref indicating if sheet is open
 * @param {Function} options.onClose - Callback when dismissed
 * @param {number} options.threshold - Pixels to swipe before dismissing (default: 100)
 */
export function useSwipeToDismiss({ elementRef, isOpen, onClose, threshold = 100 }) {
  const dragOffset = ref(0)
  const isDragging = ref(false)
  const dismissing = ref(false)

  let startY = 0
  let currentY = 0
  let canDismiss = false // Track if swipe-to-dismiss is allowed for this gesture

  // Find the nearest scrollable ancestor of an element
  function findScrollableParent(element) {
    let current = element
    while (current && current !== elementRef.value) {
      const style = window.getComputedStyle(current)
      const overflowY = style.overflowY
      if ((overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight) {
        return current
      }
      current = current.parentElement
    }
    // Check the element itself
    if (elementRef.value) {
      const style = window.getComputedStyle(elementRef.value)
      const overflowY = style.overflowY
      if ((overflowY === 'auto' || overflowY === 'scroll') && elementRef.value.scrollHeight > elementRef.value.clientHeight) {
        return elementRef.value
      }
    }
    return null
  }

  function handleTouchStart(e) {
    // Only track single touch
    if (e.touches.length !== 1) return

    startY = e.touches[0].clientY
    currentY = startY
    dragOffset.value = 0

    // Check if we're allowed to dismiss (only when scrolled to top)
    const scrollable = findScrollableParent(e.target)
    canDismiss = !scrollable || scrollable.scrollTop <= 0
    isDragging.value = canDismiss

    // Remove transition during drag for responsive feel
    if (canDismiss && elementRef.value) {
      elementRef.value.style.transition = 'none'
    }
  }

  function handleTouchMove(e) {
    if (!isDragging.value || !canDismiss) return

    currentY = e.touches[0].clientY
    const delta = currentY - startY

    // Only allow dragging down (positive delta)
    if (delta > 0) {
      dragOffset.value = delta
      if (elementRef.value) {
        elementRef.value.style.transform = `translateY(${delta}px)`
      }
      // Prevent scrolling while swiping to dismiss
      e.preventDefault()
    }
  }

  function handleTouchEnd() {
    if (!isDragging.value || !canDismiss) {
      isDragging.value = false
      canDismiss = false
      return
    }

    isDragging.value = false
    canDismiss = false

    // Restore transition for snap-back animation
    if (elementRef.value) {
      elementRef.value.style.transition = 'transform 0.2s ease-out'
    }

    if (dragOffset.value > threshold) {
      // Dismiss - animate off screen then close
      dismissing.value = true
      if (elementRef.value) {
        elementRef.value.style.transform = 'translateY(100%)'
      }
      setTimeout(() => {
        onClose()
        // Don't reset styles — element is already off-screen and Vue's
        // leave transition will handle removal
      }, 200)
    } else {
      // Snap back
      if (elementRef.value) {
        elementRef.value.style.transform = ''
      }
      setTimeout(() => {
        if (elementRef.value) {
          elementRef.value.style.transition = ''
        }
      }, 200)
    }

    dragOffset.value = 0
  }

  function attachListeners() {
    const el = elementRef.value
    if (!el) return

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
  }

  function detachListeners() {
    const el = elementRef.value
    if (!el) return

    el.removeEventListener('touchstart', handleTouchStart)
    el.removeEventListener('touchmove', handleTouchMove)
    el.removeEventListener('touchend', handleTouchEnd)

    // Skip style reset during swipe dismiss — element is already at
    // translateY(100%) and Vue's leave transition handles removal
    if (!dismissing.value) {
      el.style.transform = ''
      el.style.transition = ''
    }
    dismissing.value = false
  }

  // Watch for element changes (it may not exist initially due to v-if)
  watch(
    () => elementRef.value,
    (newEl, oldEl) => {
      if (oldEl) {
        oldEl.removeEventListener('touchstart', handleTouchStart)
        oldEl.removeEventListener('touchmove', handleTouchMove)
        oldEl.removeEventListener('touchend', handleTouchEnd)
      }
      if (newEl && isOpen.value) {
        attachListeners()
      }
    }
  )

  // Watch isOpen to attach/detach when sheet opens/closes
  watch(isOpen, (open) => {
    if (open) {
      // Small delay to ensure element is mounted
      setTimeout(() => attachListeners(), 0)
    } else {
      detachListeners()
    }
  })

  onUnmounted(() => {
    detachListeners()
  })

  return {
    dragOffset,
    isDragging
  }
}
