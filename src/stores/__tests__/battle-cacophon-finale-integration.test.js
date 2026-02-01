import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'

describe('Cacophon Finale integration', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should have processFinaleEffects function', () => {
    expect(typeof battleStore.processFinaleEffects).toBe('function')
  })

  it('should process suffering_crescendo finale effect', () => {
    // Simulate some HP lost
    battleStore.totalAllyHpLost = 1500

    const heroes = [
      { instanceId: 'h1', currentHp: 500, statusEffects: [] },
      { instanceId: 'h2', currentHp: 500, statusEffects: [] }
    ]

    const finaleEffect = {
      type: 'suffering_crescendo',
      baseBuff: 10,
      hpPerPercent: 150,
      maxBonus: 25,
      duration: 3
    }

    battleStore.processFinaleEffects(heroes, [finaleEffect])

    // 1500 / 150 = 10% bonus, 10 base + 10 = 20%
    expect(heroes[0].statusEffects).toHaveLength(2)
    expect(heroes[0].statusEffects[0].type).toBe(EffectType.ATK_UP)
    expect(heroes[0].statusEffects[0].value).toBe(20)
    expect(heroes[0].statusEffects[1].type).toBe(EffectType.DEF_UP)
    expect(heroes[0].statusEffects[1].value).toBe(20)
  })

  it('should reset HP tracking after processing finale', () => {
    battleStore.totalAllyHpLost = 1500

    const heroes = [{ instanceId: 'h1', currentHp: 500, statusEffects: [] }]
    const finaleEffect = {
      type: 'suffering_crescendo',
      baseBuff: 10,
      hpPerPercent: 150,
      maxBonus: 25,
      duration: 3
    }

    battleStore.processFinaleEffects(heroes, [finaleEffect])

    expect(battleStore.totalAllyHpLost).toBe(0)
  })

  it('should apply suffering_crescendo buffs when executeFinale is called', () => {
    // Set up a Cacophon-like bard with suffering_crescendo finale
    const cacophon = {
      instanceId: 'cacophon_1',
      templateId: 'cacophon',
      template: {
        name: 'Cacophon',
        classId: 'bard',
        finale: {
          name: "Suffering's Crescendo",
          target: 'all_allies',
          effects: [
            { type: 'suffering_crescendo', baseBuff: 10, hpPerPercent: 150, maxBonus: 25, duration: 3 }
          ]
        }
      },
      currentHp: 500,
      maxHp: 500,
      currentVerses: 3,
      lastSkillName: 'Discordant Anthem',
      statusEffects: []
    }

    const ally = {
      instanceId: 'ally_1',
      templateId: 'warrior',
      template: { name: 'Warrior', classId: 'berserker' },
      currentHp: 800,
      maxHp: 1000,
      statusEffects: []
    }

    // Add heroes to battle store
    battleStore.heroes.push(cacophon, ally)
    battleStore.enemies.push({ id: 'enemy_1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, stats: { atk: 50, def: 10 }, statusEffects: [] })

    // Simulate accumulated HP loss (300 HP lost = 2% bonus, total 12%)
    battleStore.totalAllyHpLost = 300

    // Execute the finale
    battleStore.executeFinale(cacophon)

    // Check that buffs were applied to both heroes
    const cacophonAtkUp = cacophon.statusEffects.find(e => e.type === EffectType.ATK_UP)
    const cacophonDefUp = cacophon.statusEffects.find(e => e.type === EffectType.DEF_UP)
    const allyAtkUp = ally.statusEffects.find(e => e.type === EffectType.ATK_UP)
    const allyDefUp = ally.statusEffects.find(e => e.type === EffectType.DEF_UP)

    expect(cacophonAtkUp).toBeDefined()
    expect(cacophonDefUp).toBeDefined()
    expect(allyAtkUp).toBeDefined()
    expect(allyDefUp).toBeDefined()

    // 300 / 150 = 2% bonus, 10 base + 2 = 12%
    expect(cacophonAtkUp.value).toBe(12)
    expect(allyDefUp.value).toBe(12)

    // Verses should be reset
    expect(cacophon.currentVerses).toBe(0)
    expect(cacophon.lastSkillName).toBe(null)
  })
})
