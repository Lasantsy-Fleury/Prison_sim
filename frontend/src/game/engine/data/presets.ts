// Static data: names, gangs, timetables, activity→building mapping, interaction
// vocabulary and inventory catalog. Pure data, no behaviour.

import type { ScheduleEntry, InventoryItem } from '../world/types';

export const FIRST_NAMES = [
  'Tony', 'Marco', 'Sam', 'Bruno', 'Leo', 'Viktor', 'Diego', 'Nico', 'Hugo', 'Karim',
  'Yanis', 'Lucas', 'Mehdi', 'Adam', 'Sofiane', 'Enzo', 'Rayan', 'Théo', 'Noah', 'Mateo',
  'Axel', 'Dylan', 'Liam', 'Nathan', 'Ethan', 'Gabriel', 'Raphaël', 'Alex', 'Maxime', 'Bastien',
  'Cédric', 'Farid', 'Ivan', 'Joaquin', 'Klaus', 'Luca', 'Marius', 'Nadir', 'Omar', 'Paco',
];

export const LAST_NAMES = [
  'Moretti', 'Rossi', 'Bernard', 'Martin', 'Dubois', 'Nguyen', 'Garcia', 'Silva', 'Kowalski',
  'Petrov', 'Hassan', 'Khan', 'Lopez', 'Schmidt', 'Andersen', 'Okafor', 'Yilmaz', 'Costa',
  'Bianchi', 'Lefevre', 'Diallo', 'Mendez', 'Romano', 'Novak', 'Tanaka', 'Ferreira',
];

export const GUARD_NAMES = [
  'Sergent Brass', 'Agent Cole', 'Officier Reyes', 'Garde Lemaire', 'Agent Stone',
  'Sergent Vance', 'Officier Pike', 'Garde Marchand', 'Agent Frost', 'Sergent Drake',
];

export const GANG_NAMES = [
  'Les Cobras', 'La Famiglia', 'Bloodline', 'Los Lobos', 'The Saints',
  'Les Corbeaux', 'Syndicat 12', 'Les Ombres', 'Northside', 'Les Panthères',
];

/** Default inmate timetable (24h). Mapped to building types by the scheduler. */
export const INMATE_SCHEDULE: ScheduleEntry[] = [
  { hour: 6, activity: 'wake', },
  { hour: 7, activity: 'breakfast', buildingType: 'CANTEEN' },
  { hour: 8, activity: 'work', buildingType: 'WORKSHOP' },
  { hour: 12, activity: 'lunch', buildingType: 'CANTEEN' },
  { hour: 13, activity: 'yard', buildingType: 'YARD' },
  { hour: 15, activity: 'shower', buildingType: 'INFIRMARY' },
  { hour: 16, activity: 'workshop', buildingType: 'WORKSHOP' },
  { hour: 18, activity: 'dinner', buildingType: 'CANTEEN' },
  { hour: 20, activity: 'cell', buildingType: 'CELL_BLOCK' },
  { hour: 22, activity: 'sleep', buildingType: 'CELL_BLOCK' },
];

export const GUARD_SCHEDULE: ScheduleEntry[] = [
  { hour: 6, activity: 'patrol' },
  { hour: 12, activity: 'rest', buildingType: 'SECURITY' },
  { hour: 13, activity: 'patrol' },
  { hour: 18, activity: 'patrol' },
  { hour: 22, activity: 'rest', buildingType: 'SECURITY' },
];

export const ACTIVITY_BUILDING: Record<string, string[]> = {
  breakfast: ['CANTEEN'],
  lunch: ['CANTEEN'],
  dinner: ['CANTEEN'],
  work: ['WORKSHOP'],
  workshop: ['WORKSHOP'],
  yard: ['YARD'],
  shower: ['INFIRMARY'],
  medical: ['INFIRMARY'],
  visit: ['VISITING'],
  cell: ['CELL_BLOCK'],
  sleep: ['CELL_BLOCK'],
  wake: ['CELL_BLOCK'],
  rest: ['SECURITY'],
};

export const INTERACTIONS = [
  { kind: 'talk', weight: 5, bubble: 'Salut, ça va ?', bubbleKind: 'talk' as const },
  { kind: 'threat', weight: 2, bubble: 'T’as un problème ?', bubbleKind: 'threat' as const },
  { kind: 'trade', weight: 2, bubble: 'J’te fais un bon prix…', bubbleKind: 'trade' as const },
  { kind: 'help', weight: 2, bubble: 'Laisse-moi t’aider.', bubbleKind: 'help' as const },
  { kind: 'joke', weight: 3, bubble: 'Haha, t’es bête !', bubbleKind: 'talk' as const },
  { kind: 'recruit', weight: 1, bubble: 'Rejoins-nous.', bubbleKind: 'thought' as const },
  { kind: 'complot', weight: 1, bubble: 'Écoute bien…', bubbleKind: 'thought' as const },
  { kind: 'share', weight: 2, bubble: 'On partage ?', bubbleKind: 'heart' as const },
  { kind: 'insult', weight: 2, bubble: 'T’es rien.', bubbleKind: 'angry' as const },
];

export const CONTRABAND_ITEMS: InventoryItem[] = [
  { id: 'cig', label: 'Cigarettes', qty: 1, contraband: true },
  { id: 'phone', label: 'Téléphone', qty: 1, contraband: true },
  { id: 'shiv', label: 'Arme artisanale', qty: 1, contraband: true },
  { id: 'meds', label: 'Médicaments', qty: 1, contraband: false },
  { id: 'cash', label: 'Argent', qty: 1, contraband: false },
  { id: 'letter', label: 'Lettres', qty: 1, contraband: false },
  { id: 'clothes', label: 'Vêtements', qty: 1, contraband: false },
  { id: 'tool', label: 'Outils', qty: 1, contraband: false },
  { id: 'food', label: 'Nourriture', qty: 1, contraband: false },
];

export const OBJECTIVES = [
  { id: 'peace', title: 'Maintenir la paix', desc: 'Gardez moins de 3 bagarres par jour.', target: 3 },
  { id: 'health', title: 'Hygiène correcte', desc: '70% des détenus avec une hygiène < 50.', target: 70 },
  { id: 'economy', title: 'Budget positif', desc: 'Gardez le budget au-dessus de 0.', target: 0 },
  { id: 'escape', title: 'Zéro évasion', desc: 'Aucune évasion réussie cette semaine.', target: 0 },
];
