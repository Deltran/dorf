/**
 * Calculate portrait crop size as 1/4 of source dimensions.
 */
export function getCropSize(sourceWidth, sourceHeight) {
  return {
    width: Math.floor(sourceWidth / 2),
    height: Math.floor(sourceHeight / 2)
  }
}

/**
 * Calculate default crop position: horizontally centered, vertically at upper-third.
 */
export function getDefaultCropPosition(sourceWidth, sourceHeight, cropWidth, cropHeight) {
  const x = Math.floor((sourceWidth - cropWidth) / 2)
  const y = Math.max(0, Math.floor(sourceHeight / 3 - cropHeight / 2))
  return { x, y }
}

/**
 * Clamp crop position so the crop box stays within source image bounds.
 */
export function clampCropPosition(x, y, cropWidth, cropHeight, sourceWidth, sourceHeight) {
  return {
    x: Math.max(0, Math.min(x, sourceWidth - cropWidth)),
    y: Math.max(0, Math.min(y, sourceHeight - cropHeight))
  }
}
