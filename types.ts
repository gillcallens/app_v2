export enum Category {
  URGENTIETROUSSE = 'Urgentietrousse',
  INJECTIEMATERIAAL = 'Injectiemateriaal',
  DIAGNOSTICA = 'Diagnostica',
  WONDZORGMATERIAAL = 'Wondzorgmateriaal',
  KANTOORBENODIGDHEDEN = 'Kantoorbenodigdheden'
}

export enum Unit {
  BOX = 'Doos',
  VIAL = 'Flacon',
  PIECE = 'Stuk',
  PACK = 'Pak',
  BOTTLE = 'Fles'
}

export interface InventoryItem {
  id: string;
  name: string;
  category: Category | string; // Allow string for flexibility
  quantity: number; // Always stored as the base "piece" count
  itemsPerUnit?: number; // How many pieces in a Box/Pack/Bottle
  minThreshold: number; // Low stock alert level
  unit: Unit | string; // The buying unit (e.g. Box)
  batchNumber?: string;
  expiryDate?: string; // ISO Date string
  location?: string;
  lastUpdated: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'Arts' | 'Verpleegkundige' | 'Beheerder';
  avatar: string;
}

export interface ActionLog {
  id: string;
  itemId: string;
  itemName: string;
  userId: string;
  userName: string;
  action: 'DISPENSE' | 'RESTOCK' | 'ADJUST';
  quantityChanged: number; // negative for dispense, positive for restock
  timestamp: string;
  notes?: string;
}

export interface PracticeSettings {
  name: string;
  expiryThresholdMonths: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  REPORTS = 'REPORTS',
  TEAM = 'TEAM',
  SETTINGS = 'SETTINGS'
}