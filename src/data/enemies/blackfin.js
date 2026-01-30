import { EffectType } from '../statusEffects.js'

export const enemies = {
  blackfin_cutthroat: {
    id: 'blackfin_cutthroat',
    name: 'Blackfin Cutthroat',
    stats: { hp: 260, atk: 75, def: 30, spd: 20 },
    startsStealthed: true,
    skill: {
      name: 'Backstab',
      description: '200% from stealth (120% otherwise)',
      cooldown: 3,
      damagePercent: 120,
      stealthBonus: 80
    }
  },
  pit_fighter: {
    id: 'pit_fighter',
    name: 'Pit Fighter',
    stats: { hp: 340, atk: 70, def: 38, spd: 14 },
    skill: {
      name: 'Crowd Pleaser',
      description: '150% ATK. +15% ATK permanently on kill.',
      cooldown: 3,
      damagePercent: 150,
      onKill: { permanentAtkBonus: 15 }
    }
  },
  guild_poisoner: {
    id: 'guild_poisoner',
    name: 'Guild Poisoner',
    stats: { hp: 220, atk: 65, def: 28, spd: 16 },
    skill: {
      name: 'Coated Blade',
      description: '110% ATK. Stacking poison (3%/turn, 5x max).',
      cooldown: 3,
      damagePercent: 110,
      effects: [
        { type: EffectType.POISON, target: 'hero', duration: 99, value: 3, stacking: true, maxStacks: 5 }
      ]
    }
  },
  blackfin_fence: {
    id: 'blackfin_fence',
    name: 'Blackfin Fence',
    stats: { hp: 280, atk: 60, def: 35, spd: 12 },
    skill: {
      name: 'Dirty Deal',
      description: 'Heal all allies 15%. Random ally gains stealth 1 turn.',
      cooldown: 4,
      noDamage: true,
      healAllAllies: 15,
      grantRandomStealth: true
    }
  }
}
