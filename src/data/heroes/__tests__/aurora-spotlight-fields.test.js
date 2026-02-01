import { describe, it, expect } from 'vitest'
import { aurora_the_dawn } from '../5star/aurora_the_dawn.js'

describe('Aurora the Dawn - spotlight fields', () => {
  it('has epithet field', () => {
    expect(aurora_the_dawn.epithet).toBeDefined()
    expect(typeof aurora_the_dawn.epithet).toBe('string')
    expect(aurora_the_dawn.epithet.length).toBeGreaterThan(0)
  })

  it('has introQuote field', () => {
    expect(aurora_the_dawn.introQuote).toBeDefined()
    expect(typeof aurora_the_dawn.introQuote).toBe('string')
    expect(aurora_the_dawn.introQuote.length).toBeGreaterThan(0)
  })
})
