import { describe, it, expect } from 'vitest'
import { classes } from '../classes'

describe('classes', () => {
  describe('berserker', () => {
    it('has resourceType rage', () => {
      expect(classes.berserker.resourceType).toBe('rage')
    })

    it('has resourceName Rage', () => {
      expect(classes.berserker.resourceName).toBe('Rage')
    })
  })

  describe('ranger', () => {
    it('has resourceType focus', () => {
      expect(classes.ranger.resourceType).toBe('focus')
    })
  })
})
