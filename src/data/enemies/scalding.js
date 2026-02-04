import { EffectType } from '../statusEffects.js'

export const enemies = {
  vent_crawler: {
    id: 'vent_crawler',
    name: 'Vent Crawler',
    lore: 'Armored in heat-blackened chitin, it scuttles from volcanic vents with claws that sear flesh on contact.',
    stats: { hp: 380, atk: 92, def: 55, spd: 10 },
    skill: {
      name: 'Superheated Claws',
      description: '150% ATK. Burn 2 turns (4% max HP/turn).',
      cooldown: 3,
      damagePercent: 150,
      effects: [
        { type: EffectType.BURN, target: 'hero', duration: 2, value: 4 }
      ]
    }
  },
  magma_eel: {
    id: 'magma_eel',
    name: 'Magma Eel',
    lore: 'It swims through molten rock as easily as water, leaving trails of fire that spread to anything already burning.',
    stats: { hp: 320, atk: 100, def: 35, spd: 20 },
    skill: {
      name: 'Searing Lunge',
      description: '170% ATK. Spreads Burn to adjacent if target Burning.',
      cooldown: 3,
      damagePercent: 170,
      spreadDebuff: { type: 'burn', toAdjacent: true, ifTargetHas: true }
    }
  },
  volcanic_polyp: {
    id: 'volcanic_polyp',
    name: 'Volcanic Polyp',
    lore: 'A living colony of heat-gorged organisms that erupts in sympathy with the burning, punishing those already aflame.',
    stats: { hp: 280, atk: 80, def: 45, spd: 4 },
    skill: {
      name: 'Eruption',
      description: 'All Burning heroes take 60% ATK damage',
      cooldown: 3,
      initialCooldown: 3,
      damagePercent: 60,
      targetType: 'all_heroes',
      onlyIfDebuffed: 'burn'
    }
  },
  thermal_elemental: {
    id: 'thermal_elemental',
    name: 'Thermal Elemental',
    lore: 'It feeds on the suffering of the burned, drawing sustenance from every searing wound to heal its own molten body.',
    stats: { hp: 400, atk: 95, def: 42, spd: 14 },
    skill: {
      name: 'Heat Absorption',
      description: 'Heal 10% max HP per Burning hero at turn start',
      cooldown: 0,
      isPassive: true,
      startOfTurn: { healPercentPerBurningHero: 10 }
    }
  }
}
