import { EffectType } from '../statusEffects.js'

export const enemies = {
  juvenile_horror: {
    id: 'juvenile_horror',
    name: 'Juvenile Horror',
    stats: { hp: 200, atk: 88, def: 28, spd: 22 },
    skill: {
      name: 'Feeding Frenzy',
      description: '130% ATK. Attack twice if another Juvenile died this turn.',
      cooldown: 3,
      damagePercent: 130,
      doubleIfAllyDiedThisTurn: 'juvenile_horror'
    }
  },
  brood_tender: {
    id: 'brood_tender',
    name: 'Brood Tender',
    stats: { hp: 340, atk: 82, def: 45, spd: 10 },
    skill: {
      name: 'Nurture',
      description: 'Summon 2 Juveniles. If present, heal them 30% instead.',
      cooldown: 4,
      summon: { enemyId: 'juvenile_horror', count: 2 },
      altIfSummonsPresent: { healAllSummons: 30 }
    }
  },
  egg_cluster: {
    id: 'egg_cluster',
    name: 'Egg Cluster',
    stats: { hp: 450, atk: 0, def: 60, spd: 0 },
    cannotAttack: true,
    skill: {
      name: 'Hatching',
      description: "Can't attack. Spawns 1 Juvenile/turn. If killed, all allies +30% ATK 2 turns.",
      cooldown: 0,
      isPassive: true,
      startOfTurn: { summon: 'juvenile_horror' },
      onDeath: {
        effects: [
          { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 30 }
        ]
      }
    }
  },
  the_matriarch: {
    id: 'the_matriarch',
    name: 'The Matriarch',
    stats: { hp: 480, atk: 98, def: 50, spd: 12 },
    imageSize: 140,
    skill: {
      name: "Mother's Wrath",
      description: '180% ATK to all. +50% if any Juvenile/Egg died this battle.',
      cooldown: 4,
      damagePercent: 180,
      targetType: 'all_heroes',
      bonusIfSpecificAllyDied: { enemyIds: ['juvenile_horror', 'egg_cluster'], bonus: 50 }
    }
  }
}
