// src/composables/useParticleBurst.js
// Particle burst effect for celebration animations

/**
 * Create a particle burst from a target element.
 * @param {HTMLElement} element - The element to burst from
 * @param {Object} options
 * @param {string} options.color - CSS color for particles
 * @param {number} [options.count=18] - Number of particles
 * @param {number} [options.duration=800] - Animation duration in ms
 * @param {boolean} [options.stars=false] - Include star-shaped particles (for high rarity)
 */
export function particleBurst(element, options = {}) {
  const {
    color = '#f59e0b',
    count = 18,
    duration = 800,
    stars = false
  } = options

  const rect = element.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;'
  document.body.appendChild(container)

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('span')
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    const speed = 40 + Math.random() * 60
    const dx = Math.cos(angle) * speed
    const dy = Math.sin(angle) * speed
    const size = stars && i % 5 === 0 ? 8 : 3 + Math.random() * 3

    particle.style.cssText = `
      position: absolute;
      left: ${cx}px;
      top: ${cy}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${stars && i % 5 === 0 ? '2px' : '50%'};
      opacity: 1;
      transform: translate(-50%, -50%);
      pointer-events: none;
    `

    if (stars && i % 5 === 0) {
      particle.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`
    }

    container.appendChild(particle)

    // Animate with requestAnimationFrame
    const startTime = performance.now()
    function animate(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      const x = cx + dx * ease
      const y = cy + dy * ease
      const opacity = 1 - progress
      const scale = 1 - progress * 0.5

      particle.style.left = `${x}px`
      particle.style.top = `${y}px`
      particle.style.opacity = opacity
      particle.style.transform = `translate(-50%, -50%) scale(${scale})`

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }

  // Clean up
  setTimeout(() => {
    container.remove()
  }, duration + 50)
}

/**
 * Apply a scale bounce animation to an element.
 * @param {HTMLElement} element - The element to bounce
 * @param {number} [duration=400] - Duration in ms
 */
export function scaleBounce(element, duration = 400) {
  element.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
  element.style.transform = 'scale(1.3)'
  setTimeout(() => {
    element.style.transform = 'scale(1)'
  }, duration * 0.4)
  setTimeout(() => {
    element.style.transition = ''
    element.style.transform = ''
  }, duration)
}

/**
 * Apply a glow pulse animation to an element.
 * @param {HTMLElement} element - The element to glow
 * @param {string} color - CSS color for the glow
 * @param {number} [duration=600] - Duration in ms
 */
export function glowPulse(element, color, duration = 600) {
  element.style.transition = `box-shadow ${duration}ms ease`
  element.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}`
  setTimeout(() => {
    element.style.boxShadow = ''
  }, duration * 0.5)
  setTimeout(() => {
    element.style.transition = ''
  }, duration)
}
