// Appearance palettes + generators. Physical look is fully data-driven and is
// NEVER used to infer personality (per spec §3).

import type { Appearance } from '../world/types';
import type { Rng } from '../core/Rng';

export const SKIN_TONES = [
  '#f3d2b3', '#e8b98f', '#d89c6a', '#c1844a', '#a9693b', '#8a4f2c', '#6b3a20', '#f6e0c8',
];

export const HAIR_COLORS = [
  '#2b2b2b', '#4a3526', '#7a5230', '#b07a3c', '#d9b88a', '#9a9a9a', '#e8e8e8', '#c0392b', '#6c3fb5', '#1f6f8b',
];

export const CLOTHES_COLORS = [
  '#3a4a5a', '#5a3a4a', '#3a5a4a', '#5a523a', '#444a5a', '#503a5a', '#2f3b46', '#6b4a3a', '#3a6b5a', '#54586a',
];

export const HAIR_STYLES = ['buzz', 'short', 'long', 'mohawk', 'bun', 'afro', 'bald', 'curly', 'ponytail'] as const;
export const HATS = ['none', 'cap', 'beanie', 'bandana'] as const;

export function appearanceKey(a: Appearance): string {
  return [
    a.skin, a.hairStyle, a.hairColor, a.facialHair, a.glasses ? 1 : 0, a.hat,
    a.tattoo ? 1 : 0, a.scar ? 1 : 0, a.build, a.height, a.ageLook, a.clothes, a.accessory,
  ].join('');
}

export function randomAppearance(rng: Rng): Appearance {
  return {
    skin: rng.int(0, SKIN_TONES.length - 1),
    hairStyle: rng.int(0, HAIR_STYLES.length - 1),
    hairColor: rng.int(0, HAIR_COLORS.length - 1),
    facialHair: rng.chance(0.55) ? rng.int(1, 3) : 0,
    glasses: rng.chance(0.2),
    hat: rng.chance(0.3) ? rng.int(1, HATS.length - 1) : 0,
    tattoo: rng.chance(0.3),
    scar: rng.chance(0.2),
    build: rng.weighted([0, 1, 2, 3], [1, 3, 2, 1]),
    height: rng.weighted([0, 1, 2], [1, 4, 1]),
    ageLook: rng.weighted([0, 1, 2, 3], [3, 4, 2, 1]),
    clothes: rng.int(0, CLOTHES_COLORS.length - 1),
    accessory: rng.chance(0.35) ? rng.int(1, 4) : 0,
  };
}

/** A handful of ready-made avatars for the creator UI. */
export const PRESET_AVATARS: { name: string; appearance: Appearance }[] = [
  {
    name: 'Tony «Le Calme»',
    appearance: { skin: 3, hairStyle: 1, hairColor: 1, facialHair: 2, glasses: false, hat: 0, tattoo: true, scar: false, build: 2, height: 1, ageLook: 2, clothes: 0, accessory: 0 },
  },
  {
    name: 'Marco «L’Éclair»',
    appearance: { skin: 5, hairStyle: 3, hairColor: 8, facialHair: 0, glasses: false, hat: 3, tattoo: true, scar: true, build: 1, height: 2, ageLook: 1, clothes: 6, accessory: 1 },
  },
  {
    name: 'Sam «Le Prof»',
    appearance: { skin: 1, hairStyle: 8, hairColor: 0, facialHair: 0, glasses: true, hat: 1, tattoo: false, scar: false, build: 0, height: 1, ageLook: 3, clothes: 3, accessory: 2 },
  },
  {
    name: 'Bruno «Le Mur»',
    appearance: { skin: 4, hairStyle: 0, hairColor: 1, facialHair: 3, glasses: false, hat: 0, tattoo: true, scar: true, build: 3, height: 2, ageLook: 2, clothes: 7, accessory: 4 },
  },
  {
    name: 'Leo «Le Doux»',
    appearance: { skin: 6, hairStyle: 4, hairColor: 2, facialHair: 0, glasses: false, hat: 2, tattoo: false, scar: false, build: 1, height: 0, ageLook: 0, clothes: 5, accessory: 3 },
  },
  {
    name: 'Viktor «L’Ombre»',
    appearance: { skin: 2, hairStyle: 6, hairColor: 9, facialHair: 0, glasses: false, hat: 3, tattoo: true, scar: false, build: 2, height: 1, ageLook: 3, clothes: 1, accessory: 0 },
  },
  {
    name: 'Diego «El Sol»',
    appearance: { skin: 7, hairStyle: 2, hairColor: 4, facialHair: 1, glasses: false, hat: 0, tattoo: false, scar: false, build: 1, height: 1, ageLook: 1, clothes: 2, accessory: 1 },
  },
  {
    name: 'Nico «Le Gamin»',
    appearance: { skin: 0, hairStyle: 7, hairColor: 6, facialHair: 0, glasses: true, hat: 1, tattoo: false, scar: false, build: 0, height: 0, ageLook: 0, clothes: 4, accessory: 0 },
  },
];
