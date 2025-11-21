import { InventoryItem, Category, Unit, User, ActionLog, PracticeSettings } from './types';

const STORAGE_KEYS = {
  INVENTORY: 'meditrack_inventory_v3',
  LOGS: 'meditrack_logs_v3',
  USERS: 'meditrack_users_v3',
  SETTINGS: 'meditrack_settings_v3',
  CATEGORIES: 'meditrack_categories_v3'
};

// Seed Data
const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    name: 'Adrenaline Auto-injector',
    category: Category.URGENTIETROUSSE,
    quantity: 2,
    itemsPerUnit: 1,
    minThreshold: 3,
    unit: Unit.PIECE,
    expiryDate: '2025-01-15',
    location: 'Spoedkoffer',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Atropine sulfaat',
    category: Category.URGENTIETROUSSE,
    quantity: 5,
    itemsPerUnit: 1,
    minThreshold: 5,
    unit: Unit.VIAL,
    location: 'Spoedkoffer',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Naalden 21G (Groen)',
    category: Category.INJECTIEMATERIAAL,
    quantity: 150,
    itemsPerUnit: 100, // 100 per box
    minThreshold: 50,
    unit: Unit.BOX,
    location: 'Kast A',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Spuiten 5ml',
    category: Category.INJECTIEMATERIAAL,
    quantity: 80,
    itemsPerUnit: 100,
    minThreshold: 40,
    unit: Unit.BOX,
    location: 'Kast A',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '5',
    name: 'CRP Sneltest Cassettes',
    category: Category.DIAGNOSTICA,
    quantity: 24,
    itemsPerUnit: 10, // 10 per box, so 2.4 boxes
    minThreshold: 15,
    unit: Unit.BOX,
    location: 'Lab',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Urine dipsticks',
    category: Category.DIAGNOSTICA,
    quantity: 4,
    itemsPerUnit: 1,
    minThreshold: 2,
    unit: Unit.BOTTLE,
    location: 'Lab',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '7',
    name: 'Steriel Gaas 5x5',
    category: Category.WONDZORGMATERIAAL,
    quantity: 200,
    itemsPerUnit: 50,
    minThreshold: 50,
    unit: Unit.PACK,
    location: 'Behandelkamer',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '8',
    name: 'Betadine Oplossing',
    category: Category.WONDZORGMATERIAAL,
    quantity: 3,
    itemsPerUnit: 1,
    minThreshold: 2,
    unit: Unit.BOTTLE,
    location: 'Behandelkamer',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '9',
    name: 'A4 Kopieerpapier',
    category: Category.KANTOORBENODIGDHEDEN,
    quantity: 2500, // 5 packs of 500
    itemsPerUnit: 500,
    minThreshold: 500,
    unit: Unit.PACK,
    location: 'Receptie',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '10',
    name: 'Toners HP Printer',
    category: Category.KANTOORBENODIGDHEDEN,
    quantity: 1,
    itemsPerUnit: 1,
    minThreshold: 1,
    unit: Unit.PIECE,
    location: 'Magazijn',
    lastUpdated: new Date().toISOString()
  }
];

const INITIAL_USERS: User[] = [
  { 
    id: 'u1', 
    username: 'arts',
    password: 'password123',
    name: 'Dr. Sarah Jansen', 
    role: 'Arts', 
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Jansen&background=0D8ABC&color=fff' 
  },
  { 
    id: 'u2', 
    username: 'zuster',
    password: 'password123',
    name: 'Zuster John', 
    role: 'Verpleegkundige', 
    avatar: 'https://ui-avatars.com/api/?name=John+de+Vries&background=random' 
  },
  { 
    id: 'u3', 
    username: 'admin',
    password: 'admin',
    name: 'Karin Beheer', 
    role: 'Beheerder', 
    avatar: 'https://ui-avatars.com/api/?name=Karin+Beheer&background=random' 
  }
];

const INITIAL_SETTINGS: PracticeSettings = {
  name: 'Huisartsenpraktijk MediTrack',
  expiryThresholdMonths: 3
};

const INITIAL_CATEGORIES = [
  'Urgentietrousse',
  'Injectiemateriaal',
  'Diagnostica',
  'Wondzorgmateriaal',
  'Kantoorbenodigdheden'
];

// Categories
export const getCategories = (): string[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  }
  return JSON.parse(stored);
};

export const saveCategories = (categories: string[]) => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
};

export const addCategory = (cat: string) => {
  const cats = getCategories();
  if (!cats.includes(cat)) {
    cats.push(cat);
    saveCategories(cats);
  }
};

export const removeCategory = (cat: string) => {
  let cats = getCategories();
  cats = cats.filter(c => c !== cat);
  saveCategories(cats);
};

// Inventory
export const getInventory = (): InventoryItem[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.INVENTORY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
    return INITIAL_INVENTORY;
  }
  return JSON.parse(stored);
};

export const saveInventory = (items: InventoryItem[]) => {
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
};

export const addInventoryItem = (item: InventoryItem) => {
  const items = getInventory();
  items.push(item);
  saveInventory(items);
};

export const updateInventoryItem = (updatedItem: InventoryItem) => {
  const items = getInventory();
  const index = items.findIndex(i => i.id === updatedItem.id);
  if (index !== -1) {
    items[index] = updatedItem;
    saveInventory(items);
  }
};

export const removeInventoryItem = (id: string) => {
  let items = getInventory();
  items = items.filter(i => i.id !== id);
  saveInventory(items);
};

// Logs
export const getLogs = (): ActionLog[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
  return stored ? JSON.parse(stored) : [];
};

export const addLog = (log: ActionLog) => {
  const logs = getLogs();
  logs.unshift(log); // Add to top
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 100))); // Keep last 100
};

// Users
export const getUsers = (): User[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(stored);
};

export const addUser = (user: User) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const removeUser = (userId: string) => {
  const users = getUsers();
  const newUsers = users.filter(u => u.id !== userId);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
};

export const updateUser = (updatedUser: User) => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
        users[index] = updatedUser;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
};

export const updateUserPassword = (userId: string, newPassword: string) => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex].password = newPassword;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return true;
  }
  return false;
};

// Settings
export const getSettings = (): PracticeSettings => {
  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    return INITIAL_SETTINGS;
  }
  return JSON.parse(stored);
};

export const saveSettings = (settings: PracticeSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};