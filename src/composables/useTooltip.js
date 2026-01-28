import { reactive } from 'vue'

// Shared reactive state read by TooltipOverlay
export const tooltipState = reactive({
  visible: false,
  text: '',
  x: 0,
  y: 0
})

let hoverTimer = null

function show(event, text) {
  const rect = event.currentTarget.getBoundingClientRect()
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
  function onPointerEnter(event, text) {
    clearTimeout(hoverTimer)
    hoverTimer = setTimeout(() => {
      show(event, text)
    }, 1000)
  }

  function onPointerLeave() {
    hide()
  }

  function onClick(event, text) {
    if (tooltipState.visible && tooltipState.text === text) {
      hide()
    } else {
      show(event, text)
    }
  }

  return { onPointerEnter, onPointerLeave, onClick }
}
