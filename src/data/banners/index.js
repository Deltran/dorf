/**
 * Banner module re-exports.
 *
 * This module provides an alternative import path for banners that includes
 * both the main banners array and individual banner imports.
 */

// Re-export everything from the main banners file
export * from '../banners.js'

// Import and re-export individual banner definitions
export { valentines_heartbreak } from './valentines_heartbreak.js'

// Import the main banners array and add new banners to it
import { banners as mainBanners } from '../banners.js'
import { valentines_heartbreak } from './valentines_heartbreak.js'

// Combined banners array that includes modular banner definitions
export const banners = [
  ...mainBanners,
  valentines_heartbreak
]
