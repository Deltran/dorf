// src/data/shops.js

export const shops = {
  gold_shop: {
    id: 'gold_shop',
    name: 'Gold Shop',
    description: 'Basic supplies for adventurers',
    currency: 'gold',
    confirmThreshold: 5000,
    inventory: [
      {
        itemId: 'tome_small',
        price: 100,
        maxStock: 5
      },
      {
        itemId: 'tome_medium',
        price: 400,
        maxStock: 3
      },
      {
        itemId: 'tome_large',
        price: 1000,
        maxStock: 1
      },
      {
        itemId: 'token_whispering_woods',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_whisper_lake',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_echoing_caverns',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_stormwind_peaks',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_blistering_cliffs',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_summit',
        price: 800,
        maxStock: 2
      }
    ]
  }
}

export function getShop(shopId) {
  return shops[shopId] || null
}

export function getAllShops() {
  return Object.values(shops)
}
