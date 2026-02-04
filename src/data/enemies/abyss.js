import { EffectType } from '../statusEffects.js'

export const enemies = {
  abyssal_lurker_deep: {
    id: 'abyssal_lurker_deep',
    name: 'Abyssal Lurker',
    lore: 'In the deepest trenches where pressure crushes steel, these predators have learned to finish what the abyss starts.',
    stats: { hp: 420, atk: 110, def: 50, spd: 22 },
    skill: {
      name: 'Pressure Crush',
      description: '150% ATK. Instant kill below 15% HP.',
      cooldown: 3,
      damagePercent: 150,
      executeThreshold: 15
    }
  },
  mind_leech: {
    id: 'mind_leech',
    name: 'Mind Leech',
    lore: 'Parasites that burrow through thought itself, draining will and vigor while their hosts weaken into hollow shells.',
    stats: { hp: 300, atk: 95, def: 38, spd: 16 },
    skill: {
      name: 'Psychic Siphon',
      description: 'Drain 10% current HP, heal self, -20% ATK 2 turns',
      cooldown: 3,
      drainPercent: 10,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 20 }
      ]
    }
  },
  void_angler: {
    id: 'void_angler',
    name: 'Void Angler',
    lore: 'A behemoth of the trench that lures prey with abyssal light, then swallows everything in its crushing, pulling maw.',
    stats: { hp: 500, atk: 105, def: 55, spd: 6 },
    skill: {
      name: 'Abyssal Lure',
      description: 'Pull all heroes, then 130% ATK to all',
      cooldown: 4,
      initialCooldown: 4,
      damagePercent: 130,
      targetType: 'all_heroes',
      pullsTargets: true
    }
  },
  spawn_of_the_maw: {
    id: 'spawn_of_the_maw',
    name: 'Spawn of the Maw',
    lore: 'Born from something vast and unspeakable in the deep, each kill feeds the brood and births another horror.',
    stats: { hp: 250, atk: 100, def: 30, spd: 18 },
    skill: {
      name: 'Endless Hunger',
      description: '140% ATK. If kills, summon another Spawn.',
      cooldown: 3,
      damagePercent: 140,
      onKill: { summon: 'spawn_of_the_maw' }
    }
  }
}
