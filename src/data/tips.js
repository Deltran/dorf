// src/data/tips.js

export const tips = {
  genus_loci_intro: {
    title: 'Genus Loci',
    message: 'These tougher than normal boss fights require a key to access, but yield greater rewards for your merging and summoning needs.',
    anchor: 'genus-loci-list'
  },
  explorations_intro: {
    title: 'Explorations',
    message: 'Send heroes on expeditions to gather resources while you\'re away. Higher rank explorations yield better rewards.',
    anchor: 'exploration-panel'
  },
  shard_drop_intro: {
    title: 'Shards',
    message: 'Shards power up your heroes! Collect them in Aquaria and beyond, then visit the Shards screen to upgrade your heroes\' skills.'
  },
  combat_intro: {
    title: 'Combat Basics',
    message: 'Choose a skill for the hero below, then select the monster you wish to attack. If you click a monster before you select a skill, the Basic Attack will be selected for you automatically. Click again to attack!'
  },
  hero_inspect_intro: {
    title: 'Hero Details',
    message: 'Double-click on a hero\'s combat card to get detailed information about their current stats and the different effects that are currently affecting them.'
  }
}

export function getTip(tipId) {
  return tips[tipId] || null
}
