import { EffectType } from '../statusEffects.js'

export const enemies = {
  prison_warden: {
    id: 'prison_warden',
    name: 'Prison Warden',
    stats: { hp: 260, atk: 48, def: 40, spd: 10 },
    skill: {
      name: 'Lockdown',
      description: 'Stun 1 turn. +1 turn if target debuffed.',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 1, bonusIfDebuffed: 1 }
      ]
    }
  },
  chain_golem: {
    id: 'chain_golem',
    name: 'Chain Golem',
    stats: { hp: 320, atk: 44, def: 52, spd: 4 },
    skill: {
      name: 'Binding Chains',
      description: 'Taunt and -50% SPD for 2 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.TAUNT, target: 'self', duration: 2 },
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 50 }
      ]
    }
  },
  drowner: {
    id: 'drowner',
    name: 'Drowner',
    stats: { hp: 180, atk: 52, def: 25, spd: 14 },
    skill: {
      name: 'Held Under',
      description: '160% to stunned, 100% otherwise',
      cooldown: 3,
      damagePercent: 100,
      bonusToDebuffed: { type: 'stun', bonus: 60 }
    }
  },
  taskmaster: {
    id: 'taskmaster',
    name: 'Taskmaster',
    stats: { hp: 200, atk: 50, def: 30, spd: 12 },
    skill: {
      name: 'Break Spirit',
      description: 'Target ATK/DEF -20% for 3 turns',
      cooldown: 3,
      noDamage: true,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 3, value: 20 },
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 3, value: 20 }
      ]
    }
  }
}
