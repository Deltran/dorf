import { EffectType } from '../statusEffects.js'

export const enemies = {
  skeleton_warrior: {
    id: 'skeleton_warrior',
    name: 'Skeleton Warrior',
    lore: 'Armed with corroded blades and bound by necromantic will, they fight with a tireless, mechanical fury.',
    stats: { hp: 120, atk: 44, def: 24, spd: 11 },
    skill: {
      name: 'Bone Cleave',
      description: 'Deal 150% ATK damage',
      cooldown: 3
    }
  },
  mummy: {
    id: 'mummy',
    name: 'Mummy',
    lore: 'Preserved in profane wrappings, it shambles forth reeking of myrrh and rot. Its curses cling like grave dust.',
    stats: { hp: 180, atk: 40, def: 30, spd: 6 },
    skill: {
      name: 'Cursed Wrappings',
      description: 'Deal 120% ATK damage and reduce target ATK and DEF by 20% for 3 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 3, value: 20 },
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 3, value: 20 }
      ]
    }
  },
  tomb_guardian: {
    id: 'tomb_guardian',
    name: 'Tomb Guardian',
    lore: 'Entombed alongside their king to serve in death as in life, these armored sentinels guard treasures no mortal was meant to claim.',
    stats: { hp: 240, atk: 45, def: 38, spd: 7 },
    skill: {
      name: 'Ancient Defense',
      description: 'Deal 130% ATK damage and increase all allies DEF by 25% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_UP, target: 'all_allies', duration: 2, value: 25 }
      ]
    }
  },
  tomb_wraith: {
    id: 'tomb_wraith',
    name: 'Tomb Wraith',
    lore: 'A shade of pure hunger that feeds on the living essence of intruders, growing stronger with every soul it drains.',
    stats: { hp: 140, atk: 52, def: 16, spd: 18 },
    skill: {
      name: 'Soul Drain',
      description: 'Deal 140% ATK damage and heal self for 50% of damage dealt',
      cooldown: 3,
      lifesteal: 50
    }
  },
  necromancer: {
    id: 'necromancer',
    name: 'Necromancer',
    lore: 'They speak to the dead with the easy familiarity of old friends, mending shattered bones and stoking cold fury in the fallen.',
    stats: { hp: 130, atk: 48, def: 18, spd: 14 },
    skill: {
      name: 'Dark Ritual',
      description: 'Heal all allies for 25% of max HP and increase ATK by 25% for 2 turns',
      cooldown: 5,
      noDamage: true,
      healAllAllies: 25,
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 25 }
      ]
    }
  },
  lich_king: {
    id: 'lich_king',
    name: 'Lich King',
    lore: 'He conquered death and found it wanting. Now he rules an empire of bone from a throne of frozen souls.',
    stats: { hp: 700, atk: 60, def: 40, spd: 12 },
    imageSize: 160,
    skills: [
      {
        name: 'Death Nova',
        description: 'Deal 120% ATK damage to all heroes and deal 25 damage at end of turn for 2 turns',
        cooldown: 4,
        targetType: 'all_heroes',
        effects: [
          { type: EffectType.POISON, target: 'all_heroes', duration: 2, value: 25 }
        ]
      },
      {
        name: 'Soul Harvest',
        description: 'Deal 180% ATK damage and heal self for 100% of damage dealt',
        cooldown: 5,
        lifesteal: 100
      }
    ]
  },
  skeletal_shard: {
    id: 'skeletal_shard',
    name: 'Skeletal Shard',
    lore: 'A jagged fragment of bone animated by residual necromancy, it lashes out with mindless, brittle aggression.',
    stats: { hp: 60, atk: 38, def: 10, spd: 14 }
  },
  bone_heap: {
    id: 'bone_heap',
    name: 'Bone Heap',
    lore: 'A mound of rattling remains that endlessly reassembles the dead into new soldiers. Destroy it or be buried in bones.',
    stats: { hp: 220, atk: 8, def: 34, spd: 3 },
    skill: {
      name: 'Reassemble',
      description: 'Assemble bones into a Skeletal Shard.',
      cooldown: 3,
      noDamage: true,
      summon: { templateId: 'skeletal_shard', count: 1 },
      effects: [],
      fallbackSkill: {
        name: 'Bone Armor',
        description: 'Spikes of bone jut outward, dealing 80% damage to attackers for 2 turns.',
        noDamage: true,
        effects: [
          { type: EffectType.THORNS, target: 'self', duration: 2, value: 80 }
        ]
      }
    }
  }
}
