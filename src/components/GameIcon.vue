<template>
  <img
    v-if="iconSrc"
    :src="iconSrc"
    :alt="name"
    class="game-icon"
    :class="[sizeClass, { inline }]"
  />
  <span v-else class="game-icon-fallback" :class="sizeClass">{{ fallback }}</span>
</template>

<script setup>
import { computed } from 'vue'

// Import all icons
import crossedSwordsIcon from '../assets/icons/crossed_swords.png'
import gemsIcon from '../assets/icons/gems.png'
import goldIcon from '../assets/icons/gold.png'
import shieldIcon from '../assets/icons/shield.png'
import compassIcon from '../assets/icons/compass.png'
import genusLociIcon from '../assets/icons/genus_loci_icon.png'
import storeGoodsIcon from '../assets/icons/store_goods.png'
import codexIcon from '../assets/icons/codex.png'
import fellowshipHallIcon from '../assets/icons/fellowship_hall.png'
import mapIcon from '../assets/icons/map.png'
import colosseumIcon from '../assets/icons/colosseum.png'
import laurelsIcon from '../assets/icons/laurels.png'
import dragonHeartIcon from '../assets/icons/dragon_heart.png'
import dragonShardIcon from '../assets/icons/shard_of_dragon_heart.png'
import shopsIcon from '../assets/icons/shops.png'
// New icons
import crownIcon from '../assets/icons/crown.png'
import fireIcon from '../assets/icons/fire.png'
import healerIcon from '../assets/icons/healer.png'
import keyIcon from '../assets/icons/key.png'
import skullIcon from '../assets/icons/skull.png'
import supportIcon from '../assets/icons/support.png'
import swordIcon from '../assets/icons/sword.png'
import targetIcon from '../assets/icons/target.png'

const icons = {
  // Role icons
  dps: crossedSwordsIcon,
  crossed_swords: crossedSwordsIcon,
  tank: shieldIcon,
  shield: shieldIcon,
  healer: healerIcon,
  support: supportIcon,

  // Currency
  gems: gemsIcon,
  gold: goldIcon,
  laurels: laurelsIcon,

  // Navigation/locations
  compass: compassIcon,
  exploration: compassIcon,
  map: mapIcon,
  castle: fellowshipHallIcon,
  fellowship_hall: fellowshipHallIcon,
  colosseum: colosseumIcon,

  // Features
  genus_loci: genusLociIcon,
  codex: codexIcon,
  store_goods: storeGoodsIcon,
  crate: storeGoodsIcon,
  shops: shopsIcon,

  // Items
  dragon_heart: dragonHeartIcon,
  dragon_shard: dragonShardIcon,
  crown: crownIcon,
  key: keyIcon,
  sword: swordIcon,

  // Status effects
  fire: fireIcon,
  skull: skullIcon,
  target: targetIcon,
}

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v)
  },
  inline: {
    type: Boolean,
    default: false
  },
  fallback: {
    type: String,
    default: '?'
  }
})

const iconSrc = computed(() => icons[props.name] || null)

const sizeClass = computed(() => `size-${props.size}`)
</script>

<style scoped>
.game-icon {
  display: block;
  object-fit: contain;
}

.game-icon.inline {
  display: inline-block;
  vertical-align: middle;
}

.game-icon-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Size variants */
.size-xs {
  width: 12px;
  height: 12px;
}

.size-sm {
  width: 16px;
  height: 16px;
}

.size-md {
  width: 20px;
  height: 20px;
}

.size-lg {
  width: 24px;
  height: 24px;
}

.size-xl {
  width: 32px;
  height: 32px;
}
</style>
