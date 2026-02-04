import { EffectType } from '../statusEffects.js'

export const enemies = {
  aquarian_enforcer: {
    id: 'aquarian_enforcer',
    name: 'Aquarian Enforcer',
    lore: 'Elite soldiers of the sunken empire, they hunt marked trespassers with ruthless, coordinated precision.',
    stats: { hp: 240, atk: 58, def: 32, spd: 14 },
    skill: {
      name: 'Trident Thrust',
      description: 'Deal 150% ATK damage. +30% to Marked targets.',
      cooldown: 3,
      damagePercent: 150,
      bonusToDebuffed: { type: 'marked', bonus: 30 }
    }
  },
  current_mage: {
    id: 'current_mage',
    name: 'Current Mage',
    lore: 'They bend the riptides to their will, marking enemies for death with sigils that make the sea itself turn hostile.',
    stats: { hp: 170, atk: 62, def: 20, spd: 16 },
    skill: {
      name: 'Riptide Mark',
      description: 'Mark target for 2 turns (+30% damage taken)',
      cooldown: 3,
      noDamage: true,
      effects: [
        { type: EffectType.MARKED, target: 'hero', duration: 2, value: 30 }
      ]
    }
  },
  patrol_shark: {
    id: 'patrol_shark',
    name: 'Patrol Shark',
    lore: 'Trained by the merfolk as living weapons, they patrol the currents in packs, driven to frenzy by the scent of blood.',
    stats: { hp: 260, atk: 65, def: 25, spd: 20 },
    skill: {
      name: 'Blood Frenzy',
      description: 'Deal 160% ATK damage. +20% ATK per enemy below 50% HP.',
      cooldown: 3,
      damagePercent: 160,
      frenzyBonus: { threshold: 50, atkPerTarget: 20 }
    }
  },
  checkpoint_warden: {
    id: 'checkpoint_warden',
    name: 'Checkpoint Warden',
    lore: 'Armored in barnacle-crusted plate, these wardens block every passage and rally their forces with booming war-horns.',
    stats: { hp: 300, atk: 50, def: 45, spd: 10 },
    skill: {
      name: 'Rally',
      description: 'All allies gain +25% ATK for 2 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 25 }
      ]
    }
  },
  commander_tideclaw: {
    id: 'commander_tideclaw',
    name: 'Commander Tideclaw',
    lore: 'The merfolk empire\'s most feared marshal, whose tactical brilliance and crushing strength have broken a hundred surface incursions.',
    stats: { hp: 1800, atk: 85, def: 50, spd: 16 },
    imageSize: 160,
    skills: [
      {
        name: "Marshal's Command",
        description: 'All allies +40% ATK/SPD for 2 turns. Self taunts 1 turn.',
        cooldown: 3,
        noDamage: true,
        effects: [
          { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 40 },
          { type: EffectType.SPD_UP, target: 'all_allies', duration: 2, value: 40 },
          { type: EffectType.TAUNT, target: 'self', duration: 1 }
        ]
      },
      {
        name: "Executioner's Verdict",
        description: 'Deal 200% ATK to lowest HP hero. If kills, heal all allies 15%.',
        cooldown: 4,
        damagePercent: 200,
        targetLowestHp: true,
        onKill: { healAllAllies: 15 }
      }
    ]
  }
}
