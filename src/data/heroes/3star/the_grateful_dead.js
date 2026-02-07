import { EffectType } from '../../statusEffects.js'

export const the_grateful_dead = {
  id: 'the_grateful_dead',
  name: 'The Grateful Dead',
  rarity: 3,
  classId: 'knight',
  baseStats: { hp: 105, atk: 24, def: 26, spd: 9 },
  skills: [
    {
      name: 'Grave Tap',
      description: 'A skeletal strike that builds Valor. Deal 85% ATK damage and gain 10 Valor.',
      skillUnlockLevel: 1,
      valorRequired: 0,
      valorGain: 10,
      targetType: 'enemy',
      damagePercent: 85
    },
    {
      name: 'A Minor Inconvenience',
      description: 'Shrug off crowd control effects and prepare to counter. Cleanse stun, sleep, and heal block from self, then gain Riposte for 2 turns.',
      skillUnlockLevel: 1,
      valorRequired: 15,
      targetType: 'self',
      noDamage: true,
      cleanseSelf: [
        'stun',
        'sleep',
        'heal_block'
      ],
      effects: [
        {
          type: EffectType.RIPOSTE,
          target: 'self',
          duration: 2
        }
      ]
    },
    {
      name: 'Cold Comfort',
      description: 'Grant an ally a shield equal to 30% of their max HP. Death is just the beginning of protection.',
      skillUnlockLevel: 3,
      valorRequired: 25,
      targetType: 'ally',
      noDamage: true,
      effects: [
        {
          type: EffectType.SHIELD,
          target: 'ally',
          shieldPercentMaxHp: 30
        }
      ]
    },
    {
      name: 'Bygone Valor',
      description: 'Consume all Valor to unleash an AoE attack. Deal 60% ATK + 1% per Valor consumed (max +100%) to all enemies and heal for 50% of damage dealt. At 100 Valor: also apply 20% DEF Down for 2 turns.',
      skillUnlockLevel: 6,
      valorRequired: 1,
      valorCost: 'all',
      targetType: 'all_enemies',
      damagePercent: 60,
      bonusDamagePerValor: 1,
      maxBonusDamage: 100,
      healSelfPercent: 50,
      at100Valor: {
        effects: [
          { type: 'def_down', target: 'enemy', duration: 2, value: 20 }
        ]
      }
    },
    {
      name: 'Already Dead',
      description: 'Passive: Gain bonuses as Valor accumulates. 25: +10% DEF. 50: +15% ATK. 75: Riposte heals 10% of damage dealt. 100: Survive one fatal hit per battle.',
      skillUnlockLevel: 12,
      isPassive: true,
      passiveType: 'valorThreshold',
      thresholds: [
        { valor: 25, stat: 'def', value: 10 },
        { valor: 50, stat: 'atk', value: 15 },
        { valor: 75, riposteLifesteal: 10 },
        { valor: 100, deathPrevention: true, oncePerBattle: true }
      ]
    }
  ],
  epithet: 'Courtly Corpse',
  introQuote: 'Ah, splendid! New companions. Do pardon the smell - persistent cold, I\'m afraid.',
  lore: 'A knight who died defending a nameless village and simply refused to stop. He retains impeccable manners, a dry wit, and absolutely no pulse. He fights because honor demands it, and being dead is no excuse for poor conduct.'
}
