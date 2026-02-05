import { describe, it, expect } from 'vitest'
import { colosseumBouts, getColosseumBout, getColosseumShopItems } from '../colosseum.js'
import { getAllHeroTemplates } from '../heroes/index.js'

describe('Colosseum Bout Data', () => {
  it('has exactly 50 bouts', () => {
    expect(colosseumBouts).toHaveLength(50)
  })

  it('bouts are numbered 1 through 50', () => {
    colosseumBouts.forEach((bout, i) => {
      expect(bout.bout).toBe(i + 1)
    })
  })

  it('every bout has a name', () => {
    colosseumBouts.forEach(bout => {
      expect(bout.name).toBeTruthy()
      expect(typeof bout.name).toBe('string')
    })
  })

  it('every bout has exactly 4 heroes', () => {
    colosseumBouts.forEach(bout => {
      expect(bout.heroes).toHaveLength(4)
    })
  })

  it('every hero entry has required fields', () => {
    colosseumBouts.forEach(bout => {
      bout.heroes.forEach(hero => {
        expect(hero.templateId).toBeTruthy()
        expect(typeof hero.level).toBe('number')
        expect(hero.level).toBeGreaterThan(0)
        expect(typeof hero.stars).toBe('number')
        expect(hero.stars).toBeGreaterThanOrEqual(1)
        expect(hero.stars).toBeLessThanOrEqual(5)
        expect(typeof hero.shardTier).toBe('number')
        expect(hero.shardTier).toBeGreaterThanOrEqual(0)
        expect(hero.shardTier).toBeLessThanOrEqual(3)
      })
    })
  })

  it('all hero templateIds reference valid hero templates', () => {
    const allTemplates = getAllHeroTemplates()
    const validIds = allTemplates.map(t => t.id)
    colosseumBouts.forEach(bout => {
      bout.heroes.forEach(hero => {
        expect(validIds).toContain(hero.templateId)
      })
    })
  })

  describe('star rating progression', () => {
    it('bouts 1-8 use 1-star heroes', () => {
      colosseumBouts.slice(0, 8).forEach(bout => {
        bout.heroes.forEach(hero => {
          expect(hero.stars).toBe(1)
        })
      })
    })

    it('bouts 9-16 use 2-star heroes', () => {
      colosseumBouts.slice(8, 16).forEach(bout => {
        bout.heroes.forEach(hero => {
          expect(hero.stars).toBe(2)
        })
      })
    })

    it('bouts 17-28 use 3-star heroes', () => {
      colosseumBouts.slice(16, 28).forEach(bout => {
        bout.heroes.forEach(hero => {
          expect(hero.stars).toBe(3)
        })
      })
    })

    it('bouts 29-40 use 4-star heroes', () => {
      colosseumBouts.slice(28, 40).forEach(bout => {
        bout.heroes.forEach(hero => {
          expect(hero.stars).toBe(4)
        })
      })
    })

    it('bouts 41-50 use 5-star heroes', () => {
      colosseumBouts.slice(40, 50).forEach(bout => {
        bout.heroes.forEach(hero => {
          expect(hero.stars).toBe(5)
        })
      })
    })
  })

  describe('level progression', () => {
    it('levels increase generally from bout 1 to bout 50', () => {
      const firstBoutMaxLevel = Math.max(...colosseumBouts[0].heroes.map(h => h.level))
      const lastBoutMinLevel = Math.min(...colosseumBouts[49].heroes.map(h => h.level))
      expect(lastBoutMinLevel).toBeGreaterThan(firstBoutMaxLevel)
    })

    it('bout 1 heroes are around level 5', () => {
      colosseumBouts[0].heroes.forEach(hero => {
        expect(hero.level).toBeGreaterThanOrEqual(3)
        expect(hero.level).toBeLessThanOrEqual(10)
      })
    })

    it('bout 50 heroes are around level 250', () => {
      colosseumBouts[49].heroes.forEach(hero => {
        expect(hero.level).toBeGreaterThanOrEqual(230)
        expect(hero.level).toBeLessThanOrEqual(260)
      })
    })
  })

  describe('shard tiers', () => {
    it('bouts 1-28 have no shard tiers', () => {
      colosseumBouts.slice(0, 28).forEach(bout => {
        bout.heroes.forEach(hero => {
          expect(hero.shardTier).toBe(0)
        })
      })
    })

    it('bouts 29-33 have no shard tiers', () => {
      colosseumBouts.slice(28, 33).forEach(bout => {
        bout.heroes.forEach(hero => {
          expect(hero.shardTier).toBe(0)
        })
      })
    })

    it('bouts 34-38 have shard tier 1', () => {
      colosseumBouts.slice(33, 38).forEach(bout => {
        bout.heroes.forEach(hero => {
          expect(hero.shardTier).toBe(1)
        })
      })
    })

    it('bouts 39-43 have shard tier 2', () => {
      colosseumBouts.slice(38, 43).forEach(bout => {
        bout.heroes.forEach(hero => {
          expect(hero.shardTier).toBe(2)
        })
      })
    })

    it('bouts 44-50 have shard tier 3', () => {
      colosseumBouts.slice(43, 50).forEach(bout => {
        bout.heroes.forEach(hero => {
          expect(hero.shardTier).toBe(3)
        })
      })
    })
  })

  describe('leader skills', () => {
    it('bouts 1-40 have no leader', () => {
      colosseumBouts.slice(0, 40).forEach(bout => {
        expect(bout.leader).toBeNull()
      })
    })

    it('bouts 41-50 have a leader', () => {
      colosseumBouts.slice(40, 50).forEach(bout => {
        expect(bout.leader).toBeTruthy()
        // Leader must be one of the bout's heroes
        const heroIds = bout.heroes.map(h => h.templateId)
        expect(heroIds).toContain(bout.leader)
      })
    })
  })

  describe('rewards', () => {
    it('every bout has firstClearReward (laurels)', () => {
      colosseumBouts.forEach(bout => {
        expect(typeof bout.firstClearReward).toBe('number')
        expect(bout.firstClearReward).toBeGreaterThan(0)
      })
    })

    it('firstClearReward scales from 10 to 50', () => {
      expect(colosseumBouts[0].firstClearReward).toBe(10)
      expect(colosseumBouts[49].firstClearReward).toBe(50)
    })

    it('every bout has dailyCoins', () => {
      colosseumBouts.forEach(bout => {
        expect(typeof bout.dailyCoins).toBe('number')
        expect(bout.dailyCoins).toBeGreaterThan(0)
      })
    })

    it('dailyCoins follows rate table', () => {
      // Bouts 1-10: 2 per bout
      colosseumBouts.slice(0, 10).forEach(bout => {
        expect(bout.dailyCoins).toBe(2)
      })
      // Bouts 11-25: 3 per bout
      colosseumBouts.slice(10, 25).forEach(bout => {
        expect(bout.dailyCoins).toBe(3)
      })
      // Bouts 26-40: 4 per bout
      colosseumBouts.slice(25, 40).forEach(bout => {
        expect(bout.dailyCoins).toBe(4)
      })
      // Bouts 41-50: 5 per bout
      colosseumBouts.slice(40, 50).forEach(bout => {
        expect(bout.dailyCoins).toBe(5)
      })
    })
  })

  describe('getColosseumBout', () => {
    it('returns bout by number', () => {
      const bout = getColosseumBout(1)
      expect(bout.bout).toBe(1)
      expect(bout.heroes).toHaveLength(4)
    })

    it('returns undefined for invalid bout number', () => {
      expect(getColosseumBout(0)).toBeUndefined()
      expect(getColosseumBout(51)).toBeUndefined()
    })
  })
})

describe('Colosseum Shop Items', () => {
  it('returns shop items array', () => {
    const items = getColosseumShopItems()
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
  })

  it('each item has required fields', () => {
    const items = getColosseumShopItems()
    items.forEach(item => {
      expect(item.id).toBeTruthy()
      expect(item.name).toBeTruthy()
      expect(typeof item.cost).toBe('number')
      expect(item.cost).toBeGreaterThan(0)
    })
  })

  it('includes Dragon Heart at 3000 laurels (unlimited)', () => {
    const items = getColosseumShopItems()
    const dh = items.find(i => i.id === 'dragon_heart')
    expect(dh).toBeDefined()
    expect(dh.cost).toBe(3000)
    // No maxStock = unlimited purchases
    expect(dh.maxStock).toBeUndefined()
  })

  it('includes Dragon Heart Shard at 800 laurels (unlimited)', () => {
    const items = getColosseumShopItems()
    const dhs = items.find(i => i.id === 'dragon_heart_shard')
    expect(dhs).toBeDefined()
    expect(dhs.cost).toBe(800)
    expect(dhs.maxStock).toBeUndefined()
  })

  it('includes Knowledge Tome Large at 150 laurels (unlimited)', () => {
    const items = getColosseumShopItems()
    const tome = items.find(i => i.id === 'tome_large')
    expect(tome).toBeDefined()
    expect(tome.cost).toBe(150)
    expect(tome.maxStock).toBeUndefined()
  })

  it('includes Gold 5000 at 100 laurels (unlimited)', () => {
    const items = getColosseumShopItems()
    const gold = items.find(i => i.id === 'gold_5000')
    expect(gold).toBeDefined()
    expect(gold.cost).toBe(100)
    expect(gold.maxStock).toBeUndefined()
  })

  it('includes Gems 100 at 200 laurels (unlimited)', () => {
    const items = getColosseumShopItems()
    const gems = items.find(i => i.id === 'gems_100')
    expect(gems).toBeDefined()
    expect(gems.cost).toBe(200)
    expect(gems.maxStock).toBeUndefined()
  })

  it('includes exclusive hero placeholders', () => {
    const items = getColosseumShopItems()
    const heroes = items.filter(i => i.type === 'exclusive_hero')
    expect(heroes.length).toBe(3)
    const rarities = heroes.map(h => h.rarity).sort()
    expect(rarities).toEqual([3, 4, 5])
  })
})
