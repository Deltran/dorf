import { reactive } from 'vue'

// Shared reactive state read by TooltipOverlay
export const tooltipState = reactive({
  visible: false,
  text: '',
  x: 0,
  y: 0
})

let hoverTimer = null

function show(el, text) {
  const rect = el.getBoundingClientRect()
  tooltipState.text = text
  tooltipState.x = rect.left + rect.width / 2
  tooltipState.y = rect.top
  tooltipState.visible = true
}

function hide() {
  clearTimeout(hoverTimer)
  hoverTimer = null
  tooltipState.visible = false
}

export function useTooltip() {
  function onPointerEnter(event, text, delay = 1000) {
    clearTimeout(hoverTimer)
    const el = event.currentTarget
    hoverTimer = setTimeout(() => {
      show(el, text)
    }, delay)
  }

  function onPointerLeave() {
    hide()
  }

  function onClick(event, text) {
    if (tooltipState.visible && tooltipState.text === text) {
      hide()
    } else {
      show(event.currentTarget, text)
    }
  }

  return { onPointerEnter, onPointerLeave, onClick }
}
