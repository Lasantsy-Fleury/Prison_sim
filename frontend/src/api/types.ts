// Types partagés avec le backend NestJS

export interface User {
  id: number;
  email: string;
  name?: string;
  createdAt?: string;
}

export interface AuthResult {
  user: User;
  access_token: string;
}

export type InmateStatus = 'ACTIVE' | 'ESCAPED' | 'TRANSFERRED' | 'RELEASED';

export interface Inmate {
  id: number;
  userId: number;
  name: string;
  age: number;
  intelligence: number;
  fear: number;
  aggressiveness: number;
  morale: number;
  behaviorScore: number;
  block: string;
  status: InmateStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type RelationType = 'ALLY' | 'ENEMY' | 'NEUTRAL';

export interface InmateRelation {
  id: number;
  inmateAId: number;
  inmateBId: number;
  type: RelationType;
  strength: number;
  targetName?: string;
}

export type PrisonEventType =
  | 'ESCAPE_ATTEMPT'
  | 'ESCAPE_SUCCESS'
  | 'FIGHT'
  | 'ALLIANCE'
  | 'CONFLICT'
  | 'CORRUPTION'
  | 'BEHAVIOR_CHANGE'
  | 'DECISION'
  | 'ARRIVAL'
  | 'TRANSFER'
  | 'RELEASE'
  | 'SECURITY_CHANGE'
  | 'FIRE'
  | 'MEDICAL'
  | 'SEARCH'
  | 'INFO';

export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface PrisonEvent {
  id: number;
  userId: number;
  day: number;
  type: PrisonEventType;
  title: string;
  description?: string | null;
  severity: EventSeverity;
  inmateId?: number | null;
  relatedInmateId?: number | null;
  createdAt?: string;
}

export interface PrisonState {
  id: number;
  userId: number;
  name: string;
  currentDay: number;
  securityLevel: number;
  budget: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimelinePage {
  data: PrisonEvent[];
  page: number;
  limit: number;
  total: number;
}

export interface AdvanceResult {
  day: number;
  state: PrisonState;
  events: PrisonEvent[];
  summary: string[];
  dayStats: Partial<Record<PrisonEventType, number>>;
  generatedCount: number;
}

export interface DashboardData {
  day: number;
  prisonName: string;
  securityLevel: number;
  budget: number;
  population: number;
  totalInmates: number;
  escaped: number;
  released: number;
  averages: {
    count: number;
    intelligence: number;
    fear: number;
    aggressiveness: number;
    morale: number;
    behaviorScore: number;
  };
  threat: number;
  recentEvents: PrisonEvent[];
  activeInmates: Inmate[];
}

export interface BehaviorBucket {
  range: string;
  min: number;
  max: number;
  count: number;
}

export interface StatsData {
  day: number;
  population: number;
  totalInmates: number;
  escaped: number;
  released: number;
  transferred: number;
  averages: DashboardData['averages'];
  behaviorBuckets: BehaviorBucket[];
  dangerousInmates: { id: number; name: string; behaviorScore: number; block: string }[];
  eventSeries: { day: number; type: PrisonEventType; count: number }[];
  eventTypeCounts: Partial<Record<PrisonEventType, number>>;
}

export type DecisionType =
  | 'INCREASE_SECURITY'
  | 'MOVE_INMATE'
  | 'SANCTION'
  | 'REWARD'
  | 'RELEASE';

export interface DecisionResult {
  ok: boolean;
  message: string;
  data?: any;
  event?: PrisonEvent;
}

export type BuildingCategory = 'room' | 'installation';

export interface BuildCatalogItem {
  type: string;
  category: BuildingCategory;
  label: string;
  w: number;
  h: number;
  capacity: number;
  buildCost: number;
}

export interface FinanceLine {
  label: string;
  amount: number;
}

export interface EconomyBreakdown {
  revenue: FinanceLine[];
  expenses: FinanceLine[];
  totalRevenue: number;
  totalExpenses: number;
  net: number;
}

export interface CreateBuildingPayload {
  type: string;
  name?: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  capacity?: number;
}
