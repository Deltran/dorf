export const topicContent = {
  combat_basics: {
    title: 'Combat Basics',
    sections: [
      {
        heading: 'Turn Order',
        body: 'Combat in Dorf is turn-based. Each round, all heroes and enemies act in order of their Speed (SPD) stat, fastest first. When everyone has taken a turn, a new round begins and the turn order is recalculated.'
      },
      {
        heading: 'Attacking',
        body: 'Each unit performs a basic attack on their turn unless they use a skill. Basic attacks deal damage based on the attacker\'s ATK stat minus the defender\'s DEF stat. Damage is always at least 1.'
      },
      {
        heading: 'Skills',
        body: 'Heroes can use skills instead of basic attacking. Skills cost resources (MP, Rage, Essence, etc.) and have cooldowns. Tap a skill from the action bar during a hero\'s turn to use it. Skills can deal damage, heal allies, apply buffs and debuffs, or protect the party.'
      },
      {
        heading: 'Auto-Battle',
        body: 'Toggle auto-battle to let the AI control your heroes. The AI uses basic attacks and will use skills when available. Auto-battle is useful for clearing content you\'ve already mastered.'
      },
      {
        heading: 'Victory & Defeat',
        body: 'You win when all enemies are defeated. You lose when all your heroes fall. On victory, you earn rewards including gold, gems, EXP, and potential item drops. Multi-wave battles require defeating all waves to claim rewards.'
      }
    ]
  },

  rarity: {
    title: 'Rarity',
    sections: [
      {
        heading: 'The Five Tiers',
        body: 'Heroes come in five rarity tiers. Rarity determines a hero\'s base stat totals, number of skills, and access to special mechanics.',
        items: [
          { label: '★ Common', color: '#9ca3af', desc: 'The weakest heroes out of the gate, but the easiest to grow through Fusion (Field Guide \u2192 Systems \u2192 Fusion). They can learn up to 4 skills through leveling up.' },
          { label: '★★ Uncommon', color: '#22c55e', desc: 'Stronger base stats while still being accessible through Fusion. They can learn up to 4 skills through leveling up.' },
          { label: '★★★ Rare', color: '#3b82f6', desc: 'Solid base stats and an expanded kit. They can learn up to 5 skills through leveling up.' },
          { label: '★★★★ Epic', color: '#a855f7', desc: 'Powerful heroes with strong base stats and complex mechanics. They can learn up to 5 skills through leveling up.' },
          { label: '★★★★★ Legendary', color: '#f59e0b', desc: 'The strongest heroes in the game with the highest base stats. They can learn up to 5 skills and have an exclusive Leader Skill that buffs the entire party when set as leader (Field Guide \u2192 Advanced Combat \u2192 Leader Skills).' }
        ]
      }
    ]
  },

  classes_and_roles: {
    title: 'Classes & Roles',
    sections: [
      {
        heading: 'Roles',
        body: 'Every hero fills one of four roles. A balanced party covers multiple roles.',
        items: [
          { label: 'Tank', desc: 'Absorbs damage and protects allies. High HP and DEF.' },
          { label: 'DPS', desc: 'Deals high damage to enemies. High ATK, lower survivability.' },
          { label: 'Healer', desc: 'Restores ally HP and keeps the party alive.' },
          { label: 'Support', desc: 'Buffs allies, debuffs enemies, and provides utility.' }
        ]
      },
      {
        heading: 'Classes',
        body: 'Classes determine a hero\'s resource system and combat style.',
        items: [
          { label: 'Knight', desc: 'Builds Valor by redirecting damage and keeping allies alive. Resets each combat. Skills scale with Valor tiers.' },
          { label: 'Paladin', desc: 'Uses Faith (MP). Balances tanking with healing and protection.' },
          { label: 'Berserker', desc: 'Builds Rage when attacking or taking hits. Spends it on devastating skills.' },
          { label: 'Mage', desc: 'Uses Mana (MP). Powerful ranged damage and area attacks.' },
          { label: 'Ranger', desc: 'Relies on Focus, a binary state. Loses it when hit or debuffed, regains it from ally buffs.' },
          { label: 'Cleric', desc: 'Uses Devotion (MP). Dedicated healer with protective abilities.' },
          { label: 'Druid', desc: 'Uses Nature (MP). Versatile healer with nature-themed abilities.' },
          { label: 'Bard', desc: 'Builds Verses with each skill. At 3 Verses, a powerful Finale triggers automatically.' },
          { label: 'Alchemist', desc: 'Manages Essence with Volatility tiers. Higher Essence means more damage but self-harm risk.' }
        ]
      },
      {
        heading: 'Unique Resource Systems',
        body: 'Some classes have completely unique mechanics. For details on how these resources work for the classes you\'ve discovered, look under the Field Guide in Class Resources.'
      }
    ]
  },

  gacha_and_summoning: {
    title: 'Gacha & Summoning',
    sections: [
      {
        heading: 'Summoning Heroes',
        body: 'Spend gems to summon new heroes. A single pull costs 100 gems. A multi-pull (10 heroes) costs 900 gems — a 10% discount. Each pull can produce a hero of any rarity.'
      },
      {
        heading: 'Base Rates',
        items: [
          { label: '1-star (Common)', desc: '40% chance' },
          { label: '2-star (Uncommon)', desc: '30% chance' },
          { label: '3-star (Rare)', desc: '20% chance' },
          { label: '4-star (Epic)', desc: '8% chance' },
          { label: '5-star (Legendary)', desc: '2% chance' }
        ]
      },
      {
        heading: 'Pity System',
        body: 'The pity system guarantees you won\'t go too long without good pulls. Pity counters carry over between summoning sessions.',
        items: [
          { label: '4-star Pity', desc: 'Every 10 pulls without a 4-star or higher guarantees one on the next pull.' },
          { label: 'Soft Pity', desc: 'After 50 pulls without a 5-star, each additional pull increases your 5-star chance by +2%.' },
          { label: 'Hard Pity', desc: 'At 90 pulls without a 5-star, the next pull is a guaranteed 5-star.' },
          { label: '10-pull Guarantee', desc: 'In a multi-pull, if none of the first 9 results are 4-star or higher, the 10th is guaranteed to be at least 4-star.' }
        ]
      },
      {
        heading: 'Duplicate Heroes',
        body: 'Pulling a hero you already own gives you another copy. Duplicate copies are used in the Fusion system to power up your heroes.'
      }
    ]
  },

  currency: {
    title: 'Currency',
    sections: [
      {
        heading: 'Gems',
        body: 'Gems are the premium currency used for summoning heroes. Earn gems from quest first-clear bonuses, reading Codex entries, quest rewards, and special events. Spend wisely — saving for multi-pulls is more efficient.'
      },
      {
        heading: 'Gold',
        body: 'Gold is the common currency used for fusion, upgrades, and purchasing items from shops. Gold flows more freely from quest completions, item sales, and explorations. Most upgrade systems cost gold.'
      },
      {
        heading: 'Earning Currency',
        body: 'Both currencies can be earned through completing quests (first-clear bonuses give the most gems), selling junk items, exploration rewards, and discovering new Codex entries. Advancing to new regions unlocks increasingly valuable rewards.'
      }
    ]
  },

  party_and_leader: {
    title: 'Party & Leader',
    sections: [
      {
        heading: 'Party Composition',
        body: 'Your party holds up to 4 heroes. A strong party includes a mix of roles — at least one tank to absorb damage, a damage dealer, and ideally a healer or support. Class resource synergies can make certain combinations especially powerful.'
      },
      {
        heading: 'Setting a Leader',
        body: 'One party member can be designated as the party leader. Only 5-star (Legendary) heroes have Leader Skills, which provide powerful bonuses to the entire party during battle. Set your leader from the Party screen.'
      },
      {
        heading: 'Leader Skill Types',
        body: 'Leader Skills come in several types: Passive effects provide constant stat bonuses. Timed effects trigger at a specific round. Passive Regen effects heal the party each round. Each Leader Skill has conditions that determine which allies benefit.'
      }
    ]
  },

  items_and_inventory: {
    title: 'Items & Inventory',
    sections: [
      {
        heading: 'Item Types',
        body: 'Items come in several types, which include:',
        items: [
          { label: 'Knowledge Tomes', desc: 'Grant hero experience when used. Come in several tiers of potency.' },
          { label: 'Junk', desc: 'Trinkets, rocks, and curiosities found on your travels. No use other than selling for gems or gold.' },
          { label: 'Keys', desc: 'Unlock Genus Loci boss encounters. Each key grants a single attempt against a specific boss.' },
          { label: 'Region Tokens', desc: 'Instantly collect rewards from a completed quest without replaying the battle. Each token is tied to a specific region.' },
          { label: 'Fusion Materials', desc: 'Rare components required to ascend heroes to higher rarity tiers through Fusion (Field Guide \u2192 Systems \u2192 Fusion).' },
          { label: 'Equipment Materials', desc: 'Weapon Stones, Armor Plates, Gem Shards, and Class Tokens used to upgrade hero equipment. Come in tiers matching rarity.' },
          { label: 'Genus Loci Crests', desc: 'Battle trophies torn from defeated bosses. Their purpose remains unknown.' }
        ]
      },
      {
        heading: 'Using Items',
        body: 'XP Tomes are used from the hero detail screen to level up heroes. Keys are consumed when challenging Genus Loci bosses. Region Tokens are used from the world map on completed quests.'
      },
      {
        heading: 'Selling Items',
        body: 'Junk items found during quests can be sold from the inventory screen. Each item has a sell value in gems or gold. Some junk items are more valuable than others — check the sell value before discarding!'
      }
    ]
  },

  valor: {
    title: 'Valor (Knight Resource)',
    sections: [
      {
        heading: 'How Valor Works',
        body: 'Valor is the Knight\'s unique resource. It resets to 0 at the start of every combat and builds during battle. Knights gain +5 Valor whenever they redirect or absorb damage for allies (from Guard, taunt, or similar effects). They also gain Valor each round for keeping their allies alive.'
      },
      {
        heading: 'Valor Requirements',
        body: 'Knight skills have a minimum Valor requirement to use. A skill with valorRequired: 25 can only be used once the Knight has accumulated at least 25 Valor. Some skills consume all Valor for scaling effects.'
      },
      {
        heading: 'Valor Scaling',
        body: 'Many Knight skills scale with Valor at defined tiers: 0, 25, 50, 75, and 100. Higher Valor tiers grant stronger effects — more damage, longer durations, or stronger buffs. Plan your Knight\'s tanking to build Valor for critical moments.'
      }
    ]
  },

  rage: {
    title: 'Rage (Berserker Resource)',
    sections: [
      {
        heading: 'How Rage Works',
        body: 'Berserkers start each battle with 0 Rage and build it through combat. They gain +10 Rage when they attack and +10 Rage when they take damage. Rage caps at 100.'
      },
      {
        heading: 'Spending Rage',
        body: 'Berserker skills cost Rage to use. A skill that costs 50 Rage requires and consumes that amount when activated. Some devastating skills consume all current Rage at once, dealing damage that scales with the amount spent.'
      },
      {
        heading: 'Strategy',
        body: 'Berserkers reward aggressive play. Taking hits builds Rage faster, so pairing a Berserker with a healer lets them sustain through damage while building toward powerful Rage skills. Save your Rage for big moments or spend it steadily — both strategies have merit.'
      }
    ]
  },

  focus: {
    title: 'Focus (Ranger Resource)',
    sections: [
      {
        heading: 'How Focus Works',
        body: 'Rangers have a binary Focus state — they\'re either Focused or not. Rangers start battle Focused and lose Focus when hit by an attack or afflicted by a debuff. Without Focus, Rangers cannot use skills.'
      },
      {
        heading: 'Regaining Focus',
        body: 'Rangers regain Focus when allies apply buffs to them. Protecting your Ranger from damage is essential to keep their skills available.'
      },
      {
        heading: 'Strategy',
        body: 'Position your Ranger behind sturdy tanks. Rangers deal excellent damage while Focused but become basic-attack-only when disrupted. A well-protected Ranger is one of the most consistent damage dealers in the game.'
      }
    ]
  },

  verse_and_finale: {
    title: 'Verse & Finale (Bard Resource)',
    sections: [
      {
        heading: 'How Verses Work',
        body: 'Bard skills are free to use (no cost), and each skill used adds +1 Verse (up to 3). Bards cannot repeat the same skill on consecutive turns, forcing variety in play. When a Bard reaches 3/3 Verses, their Finale auto-triggers next turn.'
      },
      {
        heading: 'Finale',
        body: 'The Finale is a powerful automatic ability unique to each Bard. It triggers at the start of the Bard\'s turn when at 3 Verses, costs nothing, and the Bard still gets their normal turn afterward. Finales often heal, buff, or grant resources to the entire party.'
      },
      {
        heading: 'Strategy',
        body: 'Cycle through your Bard\'s skills to build Verses quickly. Since skills can\'t be repeated consecutively, Bards with 3+ skills are more flexible. The Finale is a free bonus — plan around it by building Verses before critical turns.'
      }
    ]
  },

  essence_and_volatility: {
    title: 'Essence & Volatility (Alchemist Resource)',
    sections: [
      {
        heading: 'How Essence Works',
        body: 'Alchemists use Essence as their resource, starting at 50% of their maximum. Essence regenerates +10 per turn. Skills cost a set amount of Essence to use.'
      },
      {
        heading: 'Volatility Tiers',
        body: 'The Alchemist\'s Volatility depends on current Essence level. Stable (0-20 Essence): no bonus. Reactive (21-40): +15% damage bonus. Volatile (41+): +30% damage bonus but 5% max HP self-damage per skill used.'
      },
      {
        heading: 'Risk vs Reward',
        body: 'High Essence means more damage but self-inflicted harm. Alchemists that hover in the Volatile range deal devastating damage but need healing support. Conservative play in the Reactive range is safer but less explosive. Master the balance for maximum effect.'
      }
    ]
  },

  shards: {
    title: 'Shards',
    sections: [
      {
        heading: 'What Are Shards',
        body: 'Shards are hero-specific fragments used to upgrade skills. Each hero has their own shard type. Collect enough shards to unlock new skill tiers or enhance existing abilities.'
      },
      {
        heading: 'Shard Hunting',
        body: 'Assign heroes to shard hunting slots to passively generate shards over time. Higher-rarity heroes produce shards more slowly but their upgrades are more impactful.'
      },
      {
        heading: 'Using Shards',
        body: 'From the Shards screen, select a hero to view their shard progress and available upgrades. Skill upgrades can increase damage, add effects, reduce costs, or lower cooldowns.'
      }
    ]
  },

  fusion: {
    title: 'Fusion',
    sections: [
      {
        heading: 'What Is Fusion',
        body: 'Fusion combines duplicate heroes to create a stronger version. Feed copies of a hero into the original to increase their power. Fusion requires gold and the duplicate copies are consumed in the process.'
      },
      {
        heading: 'Fusion Benefits',
        body: 'Fused heroes gain permanent stat bonuses. Multiple fusions stack, making your core heroes significantly stronger over time. Focus fusion resources on heroes you use most.'
      },
      {
        heading: 'Requirements',
        body: '⚔️ The hero you want to upgrade (the "base")\n\n👥 Copies of that same hero at the same star level — one copy per star (a 1★ needs 1 copy, a 3★ needs 3)\n\n🪙 Gold — gets more expensive as the star level goes up\n\n💎 Rare merge materials for the big jumps (3★→4★ and 4★→5★)'
      },
      {
        heading: 'The Fusion Screen',
        body: 'The Hero Fusion screen shows the highest star level version of each hero you own that can still be upgraded. Each row shows their portrait, name, current star level, and how many copies you have.\n\nIf a hero is ready to fuse, the row will glow and say "Ready to merge!" — just tap it to go straight to that hero and start the fusion.\n\nIf you\'re not quite there yet, you\'ll see a progress tracker like "1/3 for next ★" so you always know how many more copies you need.\n\n🔨 Some heroes have a hammer icon next to their progress. This opens the Build Copies tool — it lets you combine lower-star duplicates into the copies you actually need. For example, if you need 3★ copies but only have a pile of 1★ and 2★ duplicates, Build Copies can merge them up the chain for you in one go.\n\nHeroes that have already reached 5★ won\'t show up here — they\'re fully maxed!'
      }
    ]
  },

  genus_loci: {
    title: 'Genus Loci',
    sections: [
      {
        heading: 'What Are Genus Loci',
        body: 'Genus Loci are powerful boss enemies tied to specific locations in the world. They are significantly stronger than regular enemies and feature unique passive abilities, multiple skills, and special mechanics.'
      },
      {
        heading: 'Challenging a Genus Loci',
        body: 'Genus Loci encounters require a key item to attempt. Keys are rare drops from quest nodes in the boss\'s region. Once you have a key, challenge the boss from the world map. The key is consumed win or lose.'
      },
      {
        heading: 'Boss Mechanics',
        body: 'Each Genus Loci has passive abilities that activate automatically — damage reduction, healing during sleep, counterattacks when woken, and more. Study a boss\'s abilities before fighting. Some bosses have conditional skills that only activate below certain HP thresholds.'
      },
      {
        heading: 'Rewards',
        body: 'Defeating a Genus Loci yields substantial rewards including large gem and gold payouts, rare items, and unique crests. Genus Loci bosses can be re-challenged for additional rewards.'
      }
    ]
  },

  explorations: {
    title: 'Explorations',
    sections: [
      {
        heading: 'What Are Explorations',
        body: 'Explorations are idle expeditions where you send heroes to automatically gather resources over time. Assign a party of heroes to an exploration node and they\'ll return with rewards after the timer completes.'
      },
      {
        heading: 'Starting an Exploration',
        body: 'Find exploration nodes on the world map (marked differently from combat nodes). Select heroes to send — they\'ll be unavailable for other activities while exploring. Some explorations have party composition requests for bonus rewards.'
      },
      {
        heading: 'Rewards',
        body: 'Exploration rewards include gold, gems, EXP, and item drops. Meeting the party composition request grants a 10% bonus to all rewards. Explorations continue even when the app is closed.'
      }
    ]
  },

  status_effects: {
    title: 'Status Effects',
    sections: [
      {
        heading: 'Buffs',
        body: 'Buffs are positive effects applied to your heroes. Common buffs include ATK Up (increased damage), DEF Up (reduced damage taken), SPD Up (act sooner), and Regeneration (heal over time). Buffs have a duration in turns.'
      },
      {
        heading: 'Debuffs',
        body: 'Debuffs are negative effects applied to enemies or your heroes. Common debuffs include Poison (damage over time), ATK Down, DEF Down, Stun (skip turn), and Marked (increased damage taken).'
      },
      {
        heading: 'Protection Effects',
        body: 'Some effects provide special protection: Shield absorbs incoming damage, Damage Reduction reduces all damage by a percentage, Evasion gives a chance to dodge, and Death Prevention lets a hero survive a fatal hit once at 1 HP.'
      },
      {
        heading: 'Reactive Effects',
        body: 'Reactive effects trigger when conditions are met: Flame Shield burns attackers, Thorns reflects a percentage of damage taken, and Riposte counter-attacks enemies with lower DEF. These effects make attacking the buffed unit risky.'
      }
    ]
  },

  leader_skills: {
    title: 'Leader Skills',
    sections: [
      {
        heading: 'What Are Leader Skills',
        body: 'Leader Skills are powerful abilities exclusive to 5-star (Legendary) heroes. When a hero with a Leader Skill is set as the party leader, their skill activates during battle, benefiting the entire party.'
      },
      {
        heading: 'Passive Leader Skills',
        body: 'Passive Leader Skills provide constant stat bonuses throughout the battle. For example, "All non-knight allies gain +15% DEF." These activate immediately and last the entire fight.'
      },
      {
        heading: 'Timed Leader Skills',
        body: 'Timed Leader Skills trigger at a specific round. For example, "On round 1, all allies gain +25% ATK for 2 turns." These provide powerful but temporary boosts at key moments.'
      },
      {
        heading: 'Conditions',
        body: 'Leader Skills can have conditions that filter which allies receive the effect. Conditions can target specific classes ("only Knights"), exclude classes ("all except Healers"), or target roles ("only DPS"). Check each Leader Skill\'s description to understand who benefits.'
      }
    ]
  },

  damage_interception: {
    title: 'Damage Interception',
    sections: [
      {
        heading: 'Protection Priority',
        body: 'When a hero takes damage, multiple protection effects are checked in order: Evasion (dodge entirely), Divine Sacrifice (ally intercepts), Guardian Link (split damage), Guard (full redirect), Damage Reduction, Shield, and finally normal HP damage.'
      },
      {
        heading: 'Evasion',
        body: 'Evasion gives a percentage chance to completely avoid an attack. When evasion succeeds, no damage is taken and no other effects are applied. Evasion is checked first before all other protections.'
      },
      {
        heading: 'Divine Sacrifice',
        body: 'A hero with Divine Sacrifice active intercepts ALL damage that would hit other allies, redirecting it to themselves. The interceptor benefits from their own Damage Reduction. This is an extremely powerful but self-destructive protection.'
      },
      {
        heading: 'Guardian Link',
        body: 'Guardian Link splits incoming damage between the target and a linked guardian. A portion of the damage (e.g., 40%) is redirected to the guardian while the remainder hits the original target. Both units need to survive.'
      },
      {
        heading: 'Shields & Damage Reduction',
        body: 'Shields absorb damage using a separate HP pool that depletes before the hero\'s actual HP. Damage Reduction is a flat percentage decrease applied to all incoming damage. Both can stack with other protections.'
      }
    ]
  }
}

export function getTopicContent(topicId) {
  return topicContent[topicId] || null
}
