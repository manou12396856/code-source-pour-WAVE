
export type MerchantType = 'Fixe' | 'Ambulant' | 'Taxi' | 'Moto Taxi' | 'Visite' | 'Prospection';
export type UserRole = 'agent' | 'supervisor';
export type PeriodType = 'today' | 'week' | 'month' | 'cycle';
export type Language = 'fr' | 'en';

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  icon?: string;
}

// PerformanceTarget interface used for tracking merchant acquisition goals
export interface PerformanceTarget {
  category: string;
  current: number;
  target: number;
}

export interface PeriodTargets {
  'Fixe': number;
  'Ambulant': number;
  'Taxi': number;
  'Moto Taxi': number;
  'Prospection': number;
  'Visite'?: number;
}

export interface GlobalSettings {
  individualTargets: {
    today: PeriodTargets;
    week: PeriodTargets;
    month: PeriodTargets;
    cycle: PeriodTargets;
  };
  teamTargets: {
    today: PeriodTargets;
    week: PeriodTargets;
    month: PeriodTargets;
    cycle: PeriodTargets;
  };
  broadcast?: {
    message: string;
    timestamp: number;
    author: string;
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  role: UserRole;
  zone?: string;
  photo?: string;
}

export interface DailyReport {
  id: string;
  userId: string;
  userName: string;
  lastName?: string;
  date: string;
  prospections: number;
  creations: number;
  visites: number;
  faitsTerrain: string;
  materielUtilise: Record<string, number>;
  zone: string;
}

export interface AgentProgress {
  userId: string;
  lastResets: {
    today: string;
    week: string;
    month: string;
    cycle: string;
  };
  counts: {
    today: Record<MerchantType, number>;
    week: Record<MerchantType, number>;
    month: Record<MerchantType, number>;
    cycle: Record<MerchantType, number>;
  };
}