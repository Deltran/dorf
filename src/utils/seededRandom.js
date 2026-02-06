// Mulberry32 — fast, high-quality 32-bit PRNG
export class SeededRandom {
  constructor(seed) {
    this.state = seed | 0
  }

  next() {
    this.state |= 0
    this.state = this.state + 0x6D2B79F5 | 0
    let t = Math.imul(this.state ^ this.state >>> 15, 1 | this.state)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }

  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  pick(array) {
    return array[Math.floor(this.next() * array.length)]
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  chance(percent) {
    return this.next() * 100 < percent
  }

  weightedPick(options) {
    const totalWeight = options.reduce((sum, o) => sum + o.weight, 0)
    let roll = this.next() * totalWeight
    for (const option of options) {
      roll -= option.weight
      if (roll <= 0) return option
    }
    return options[options.length - 1]
  }
}

export function createSeed(dateStr, tier, playerSalt) {
  const input = `${dateStr}:${tier}:${playerSalt}`
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}
