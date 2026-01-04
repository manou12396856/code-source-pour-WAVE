
import { User, StockItem, PerformanceTarget } from './types';

export const INITIAL_STOCK: StockItem[] = [
  { id: '1', name: 'A5 QR code', quantity: 25, icon: 'QR A5' },
  { id: '2', name: 'PVC boutique', quantity: 15, icon: 'PVC' },
  { id: '3', name: 'Badge Roaming', quantity: 10, icon: 'Badge' },
  { id: '4', name: 'Stand', quantity: 2, icon: 'Stand' },
  { id: '5', name: 'Payez Ici', quantity: 50, icon: 'Stickers' },
];

export const INITIAL_PERFORMANCE: PerformanceTarget[] = [
  { category: 'Fixe', current: 0, target: 20 },
  { category: 'Ambulant', current: 0, target: 30 },
  { category: 'Taxi', current: 0, target: 10 },
  { category: 'Moto Taxi', current: 0, target: 15 },
];

// Changed Agent type to User and adjusted the object structure to match types.ts
export const MOCK_AGENTS: User[] = [
  {
    id: 'a1',
    firstName: 'Moussa',
    lastName: 'Traoré',
    phone: '0102030405',
    role: 'agent',
    zone: 'Marcory'
  }
];
