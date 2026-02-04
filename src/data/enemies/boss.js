import { EffectType } from '../statusEffects.js'

export const enemies = {
  goblin_chieftain: {
    id: 'goblin_chieftain',
    name: 'Goblin Chieftain',
    lore: 'He wears a crown of rusted nails and rules through raw brutality. Every goblin in the wood answers to his snarl.',
    imageSize: 150,
    stats: { hp: 180, atk: 28, def: 18, spd: 10 },
    skills: [
      {
        name: 'War Cry',
        description: 'Deal 100% ATK damage to all heroes and increase own ATK by 25% for 3 turns',
        cooldown: 4,
        effects: [
          { type: EffectType.ATK_UP, target: 'self', duration: 3, value: 25 }
        ]
      },
      {
        name: 'Dominion',
        description: 'Deal 120% ATK damage to one hero and remove all their buffs',
        cooldown: 3,
        cleanse: 'buffs'
      }
    ]
  },
  spider_queen: {
    id: 'spider_queen',
    name: 'Spider Queen',
    lore: 'Her web spans the entire cavern, and every trembling strand leads back to her patient, hungry darkness.',
    stats: { hp: 220, atk: 38, def: 15, spd: 14 },
    skill: {
      name: 'Web Trap',
      description: 'Deal 130% ATK damage and reduce target SPD by 50% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 50 }
      ]
    }
  },
  shadow_dragon: {
    id: 'shadow_dragon',
    name: 'Shadow Dragon',
    lore: 'It does not breathe fire but darkness itself, a cold so absolute it devours light and hope alike.',
    imageSize: 160,
    stats: { hp: 500, atk: 55, def: 40, spd: 12 },
    skill: {
      name: 'Shadow Breath',
      description: 'Deal 150% ATK damage to all heroes',
      cooldown: 4
    }
  }
}
