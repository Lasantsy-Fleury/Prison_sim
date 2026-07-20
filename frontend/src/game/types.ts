import { LucideIcon } from 'lucide-react';
import {
  Building2,
  RectangleHorizontal,
  Users,
  Utensils,
  Stethoscope,
  Shield,
  Camera,
  Fence,
  Minus,
  MapPin,
  Hammer,
  DoorOpen,
} from 'lucide-react';
import { Inmate, PrisonEvent } from '../api/types';

export const MAP_W = 1000;
export const MAP_H = 640;

export type BuildingType =
  | 'CELL_BLOCK'
  | 'CORRIDOR'
  | 'YARD'
  | 'CANTEEN'
  | 'INFIRMARY'
  | 'SECURITY'
  | 'VISITING'
  | 'WORKSHOP'
  | 'DOOR'
  | 'CAMERA'
  | 'FENCE'
  | 'BARBED_WIRE'
  | 'GUARD_POST';

export interface Building {
  id: number;
  userId: number;
  type: BuildingType;
  category: 'room' | 'installation';
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  level: number;
  capacity: number;
  state: 'OPERATIONAL' | 'UNDER_CONSTRUCTION' | 'DAMAGED' | 'OFFLINE';
}

export interface Guard {
  id: number;
  userId: number;
  name: string;
  x: number;
  y: number;
  assignedBlock: string | null;
  salary: number;
  skill: number;
  status: 'ON_DUTY' | 'INTERVENING' | 'RESTING';
}

export interface GameInmate extends Inmate {
  /** Position cible courante (coords logiques), calculee coyte UI. */
  px: number;
  py: number;
}

interface BuildingMeta {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const BUILDING_META: Record<BuildingType, BuildingMeta> = {
  CELL_BLOCK: { label: 'Bloc cellulaire', icon: Building2, color: '#5b6b7e' },
  CORRIDOR: { label: 'Couloir', icon: RectangleHorizontal, color: '#2a3645' },
  YARD: { label: 'Cour de promenade', icon: Users, color: '#3f8f6b' },
  CANTEEN: { label: 'Cantine', icon: Utensils, color: '#c98a2a' },
  INFIRMARY: { label: 'Infirmerie', icon: Stethoscope, color: '#e06a8a' },
  SECURITY: { label: 'Salle de securite', icon: Shield, color: '#f5a524' },
  VISITING: { label: 'Parloir', icon: Users, color: '#7c6fd6' },
  WORKSHOP: { label: 'Ateliers', icon: Hammer, color: '#5b87a8' },
  DOOR: { label: 'Portail', icon: DoorOpen, color: '#8b9bab' },
  CAMERA: { label: 'Camera', icon: Camera, color: '#38bdf8' },
  FENCE: { label: 'Cloture', icon: Fence, color: '#475569' },
  BARBED_WIRE: { label: 'Fil barbele', icon: Minus, color: '#475569' },
  GUARD_POST: { label: 'Poste de garde', icon: MapPin, color: '#f5a524' },
};

export type GamePhase = 'NUIT' | 'MATIN' | 'JOUR' | 'SOIR';

export type GameEvent = PrisonEvent;
