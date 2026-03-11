
import { Reading, Building, ServiceType, Role, User, UserStatus, RequestItem, GasoilTank, Boiler, BoilerTemperatureReading, BoilerMaintenanceRecord, BoilerPart, BoilerStatus, SaltWarehouse, SaltSoftener, CalendarTask, AppNotification, GasoilReading, RefuelRequest, SaltRefillLog, SaltEntryLog, ExternalUser, WaterAccount, WaterSyncLog, GasoilAlertStatus, Provider, MaterialCategory, MaterialItem } from '../types';

const READINGS_KEY = 'sigai_readings_v5';
const USERS_KEY = 'sigai_users_v5';
const REQUESTS_KEY = 'sigai_requests_v5';
const GASOIL_TANKS_KEY = 'sigai_gasoil_tanks_v1';
const GASOIL_READINGS_KEY = 'sigai_gasoil_readings_v1';
const REFUEL_REQUESTS_KEY = 'sigai_refuel_requests_v1';
const SALT_STOCK_KEY = 'sigai_salt_stock_v2';
const SALT_SOFTENERS_KEY = 'sigai_salt_softeners_v2';
const SALT_REFILL_LOGS_KEY = 'sigai_salt_refill_logs_v1';
const SALT_ENTRY_LOGS_KEY = 'sigai_salt_entry_logs_v1';
const WATER_ACCOUNTS_KEY = 'sigai_water_accounts_v2';
const WATER_SYNC_LOGS_KEY = 'sigai_water_sync_logs_v2';

const TASKS_KEY = 'sigai_tasks_v1';
const NOTIFICATIONS_KEY = 'sigai_notifications_v1';
const EXTERNAL_CONTACTS_KEY = 'sigai_external_contacts_v1';

// NEW KEYS
const BOILERS_KEY = 'sigai_boilers_v1';
const BOILER_READINGS_KEY = 'sigai_boiler_readings_v1';
const BOILER_MAINTENANCE_KEY = 'sigai_boiler_maintenance_v1';

const PROVIDERS_KEY = 'sigai_providers_v1';
const CATEGORIES_KEY = 'sigai_categories_v1';

// --- SERVER SYNC HELPERS ---
const API_BASE = '/api';

async function fetchFromServer() {
  try {
    const res = await fetch(`${API_BASE}/data`);
    if (res.ok) {
      const data = await res.json();
      // Sync to localStorage
      if (data.readings) localStorage.setItem(READINGS_KEY, JSON.stringify(data.readings));
      if (data.users) localStorage.setItem(USERS_KEY, JSON.stringify(data.users));
      if (data.requests) localStorage.setItem(REQUESTS_KEY, JSON.stringify(data.requests));
      if (data.gasoil_tanks) localStorage.setItem(GASOIL_TANKS_KEY, JSON.stringify(data.gasoil_tanks));
      if (data.gasoil_readings) localStorage.setItem(GASOIL_READINGS_KEY, JSON.stringify(data.gasoil_readings));
      if (data.refuel_requests) localStorage.setItem(REFUEL_REQUESTS_KEY, JSON.stringify(data.refuel_requests));
      if (data.salt_stock) localStorage.setItem(SALT_STOCK_KEY, JSON.stringify(data.salt_stock));
      if (data.salt_softeners) localStorage.setItem(SALT_SOFTENERS_KEY, JSON.stringify(data.salt_softeners));
      if (data.salt_refill_logs) localStorage.setItem(SALT_REFILL_LOGS_KEY, JSON.stringify(data.salt_refill_logs));
      if (data.salt_entry_logs) localStorage.setItem(SALT_ENTRY_LOGS_KEY, JSON.stringify(data.salt_entry_logs));
      if (data.water_accounts) localStorage.setItem(WATER_ACCOUNTS_KEY, JSON.stringify(data.water_accounts));
      if (data.water_sync_logs) localStorage.setItem(WATER_SYNC_LOGS_KEY, JSON.stringify(data.water_sync_logs));
      if (data.tasks) localStorage.setItem(TASKS_KEY, JSON.stringify(data.tasks));
      if (data.notifications) localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(data.notifications));
      if (data.external_contacts) localStorage.setItem(EXTERNAL_CONTACTS_KEY, JSON.stringify(data.external_contacts));
      if (data.boilers) localStorage.setItem(BOILERS_KEY, JSON.stringify(data.boilers));
      if (data.boiler_readings) localStorage.setItem(BOILER_READINGS_KEY, JSON.stringify(data.boiler_readings));
      if (data.boiler_maintenance) localStorage.setItem(BOILER_MAINTENANCE_KEY, JSON.stringify(data.boiler_maintenance));
      if (data.providers) localStorage.setItem(PROVIDERS_KEY, JSON.stringify(data.providers));
      if (data.categories) localStorage.setItem(CATEGORIES_KEY, JSON.stringify(data.categories));
      return true;
    }
  } catch (e) {
    console.error("Sync error:", e);
  }
  return false;
}

async function saveToServer() {
  try {
    const data = {
      readings: JSON.parse(localStorage.getItem(READINGS_KEY) || '[]'),
      users: JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
      requests: JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]'),
      gasoil_tanks: JSON.parse(localStorage.getItem(GASOIL_TANKS_KEY) || '[]'),
      gasoil_readings: JSON.parse(localStorage.getItem(GASOIL_READINGS_KEY) || '[]'),
      refuel_requests: JSON.parse(localStorage.getItem(REFUEL_REQUESTS_KEY) || '[]'),
      salt_stock: JSON.parse(localStorage.getItem(SALT_STOCK_KEY) || 'null'),
      salt_softeners: JSON.parse(localStorage.getItem(SALT_SOFTENERS_KEY) || '[]'),
      salt_refill_logs: JSON.parse(localStorage.getItem(SALT_REFILL_LOGS_KEY) || '[]'),
      salt_entry_logs: JSON.parse(localStorage.getItem(SALT_ENTRY_LOGS_KEY) || '[]'),
      water_accounts: JSON.parse(localStorage.getItem(WATER_ACCOUNTS_KEY) || '[]'),
      water_sync_logs: JSON.parse(localStorage.getItem(WATER_SYNC_LOGS_KEY) || '[]'),
      tasks: JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'),
      notifications: JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]'),
      external_contacts: JSON.parse(localStorage.getItem(EXTERNAL_CONTACTS_KEY) || '[]'),
      boilers: JSON.parse(localStorage.getItem(BOILERS_KEY) || '[]'),
      boiler_readings: JSON.parse(localStorage.getItem(BOILER_READINGS_KEY) || '[]'),
      boiler_maintenance: JSON.parse(localStorage.getItem(BOILER_MAINTENANCE_KEY) || '[]'),
      providers: JSON.parse(localStorage.getItem(PROVIDERS_KEY) || '[]'),
      categories: JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]'),
    };
    await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error("Save error:", e);
  }
}

export const BUILDINGS: Building[] = [
  { id: 'E0007', name: 'Vestuario de Mandos', code: 'E0007', unit: 'USAC', hasBoiler: true },
  { id: 'E0010', name: 'Vestuario GCG y GOE III', code: 'E0010', unit: 'GCG', hasBoiler: true },
  { id: 'E0056', name: 'Vestuario Tropa Femenino', code: 'E0056', unit: 'USAC', hasBoiler: true },
  { id: 'E0048', name: 'Vestuario GOE XIX y Sala Victrix', code: 'E0048', unit: 'BOEL', hasBoiler: true },
  { id: 'E0059', name: 'Vestuario GOE IV', code: 'E0059', unit: 'GOE4', hasBoiler: true },
  { id: 'E0064', name: 'Alojamiento Logístico de Mandos 3', code: 'E0064', unit: 'USAC', hasBoiler: true },
  { id: 'E0065', name: 'Estado Mayor MOE', code: 'E0065', unit: 'USAC', hasBoiler: true },
  { id: 'E0068', name: 'Alojamiento Tropa A', code: 'E0068', unit: 'USAC', hasBoiler: true },
  { id: 'CT_1_2', name: 'Centro de transformación 1 y 2', code: 'CT12', unit: 'USAC', hasBoiler: false },
  { id: 'CT_3', name: 'Centro de transformación 3', code: 'CT3', unit: 'USAC', hasBoiler: false },
];

/**
 * Common boiler parts used in the maintenance module
 */
export const PIEZAS_COMUNES: BoilerPart[] = [
  { id: 'p1', name: 'Fotocélula QRB1', category: 'Electrónica', price: 45.50 },
  { id: 'p2', name: 'Boquilla Danfoss 0.60', category: 'Combustión', price: 12.80 },
  { id: 'p3', name: 'Filtro Gasoil 3/8', category: 'Suministro', price: 8.50 },
  { id: 'p4', name: 'Junta de Estanqueidad', category: 'Mecánica', price: 3.20 },
  { id: 'p5', name: 'Termostato Inmersión', category: 'Control', price: 22.00 }
];

export const storageService = {
  // --- SYNC ---
  init: async () => {
    return await fetchFromServer();
  },

  // --- WATER TELEMETRY (CUENTA ÚNICA) ---
  getWaterAccount: (): WaterAccount => {
    const data = localStorage.getItem(WATER_ACCOUNTS_KEY);
    if (!data) {
      const initial: WaterAccount = {
        id: 'main-water-account',
        buildingId: 'BASE_ALICANTE',
        buildingCode: 'BASE',
        buildingName: 'Contador General Red Principal',
        contractNumber: 'S0300017A',
        webUser: 'S0300017A',
        syncActive: true,
        status: 'conectada',
        peakThresholdPercent: 50,
        peakThresholdM3: 15,
        syncFrequency: 'diaria',
        selectors: {
          userField: 'input[name*="user" i]',
          passField: 'input[type="password"]',
          submitBtn: 'button[type="submit"]',
          tableSelector: 'table'
        }
      };
      localStorage.setItem(WATER_ACCOUNTS_KEY, JSON.stringify([initial]));
      return initial;
    }
    return JSON.parse(data)[0];
  },

  saveWaterAccount: (account: WaterAccount) => {
    localStorage.setItem(WATER_ACCOUNTS_KEY, JSON.stringify([account]));
    saveToServer();
  },

  getWaterSyncLogs: (): WaterSyncLog[] => {
    const data = localStorage.getItem(WATER_SYNC_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  simulateWaterSync: async (accountId: string, onStep?: (msg: string) => void): Promise<{ success: boolean, reading?: Reading, message: string }> => {
    const account = storageService.getWaterAccount();
    const startTime = Date.now();
    const debugSteps: string[] = [];

    const logStep = (msg: string) => {
      debugSteps.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      if (onStep) onStep(msg);
    };

    logStep("Iniciando Puppeteer Headless Engine...");
    await new Promise(r => setTimeout(r, 800));
    
    logStep("🔍 ETAPA 1: Buscando página de login...");
    logStep("Probando URL: https://www.aguasdealicante.es/acceso-area-privada");
    await new Promise(r => setTimeout(r, 1200));

    logStep("🔍 ETAPA 2: Analizando formulario de login...");
    await new Promise(r => setTimeout(r, 600));

    logStep("🔍 ETAPA 3: Identificando selectores...");
    logStep(`Selector usuario: ${account.selectors?.userField || 'auto'}`);
    logStep(`Selector password: ${account.selectors?.passField || 'auto'}`);
    await new Promise(r => setTimeout(r, 500));

    logStep("🔍 ETAPA 4: Intentando login...");
    logStep(`Enviando credenciales para usuario: ${account.webUser}`);
    await new Promise(r => setTimeout(r, 1000));

    try {
      logStep("🔍 ETAPA 5: Buscando sección de consumos...");
      logStep("Extrayendo tabla de datos...");
      await new Promise(r => setTimeout(r, 800));

      const readings = storageService.getReadings('BASE_ALICANTE', 'agua');
      const lastReading = readings.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      const prevValue = lastReading?.value1 || 12450;
      const consumption = Math.floor(Math.random() * 20) + 2; 
      const newValue = prevValue + consumption;

      const last30Days = readings.filter(r => {
        const diff = Date.now() - new Date(r.date).getTime();
        return diff < (30 * 24 * 60 * 60 * 1000);
      });
      const avgConsumption = last30Days.length > 0 
        ? last30Days.reduce((sum, r) => sum + (r.consumption1 || 0), 0) / last30Days.length 
        : 8.5;

      const percentOverAvg = ((consumption - avgConsumption) / avgConsumption) * 100;
      const isPeak = percentOverAvg > account.peakThresholdPercent || consumption > account.peakThresholdM3;

      const newReading: Reading = {
        id: crypto.randomUUID(),
        buildingId: 'BASE_ALICANTE',
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        userId: 'system_bot',
        serviceType: 'agua',
        origin: 'telematica',
        value1: newValue,
        consumption1: consumption,
        isPeak,
        peakPercentage: percentOverAvg
      };

      storageService.saveReading(newReading);
      
      account.lastSync = new Date().toISOString();
      account.status = 'conectada';
      storageService.saveWaterAccount(account);

      logStep("✅ Sincronización completada con éxito.");

      const log: WaterSyncLog = {
        id: crypto.randomUUID(),
        accountId,
        date: new Date().toISOString(),
        status: 'exito',
        readingsObtained: 1,
        executionTimeMs: Date.now() - startTime,
        debugSteps
      };
      const logs = storageService.getWaterSyncLogs();
      localStorage.setItem(WATER_SYNC_LOGS_KEY, JSON.stringify([log, ...logs.slice(0, 99)]));

      if (isPeak) {
        storageService.addNotification({
          id: crypto.randomUUID(),
          userId: 'any',
          title: '🚨 ALERTA: CONSUMO DE AGUA ANÓMALO',
          message: `Detección en contador principal: ${consumption} m³ hoy. Supera umbral (+${percentOverAvg.toFixed(0)}%).`,
          type: 'system',
          read: false,
          date: new Date().toISOString()
        });
      }

      return { success: true, reading: newReading, message: 'Portal Aguas de Alicante sincronizado.' };
    } catch (e) {
      logStep("❌ Error crítico en etapa de extracción.");
      return { success: false, message: 'Error de red en portal externo.' };
    }
  },

  // --- USERS ---
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    const initial: User[] = [
      { id: 'master-1', name: 'Master Admin', username: 'master@picks.pro', password: '123', role: 'MASTER', status: 'approved', assignedBuildings: [], assignedUnits: ['USAC', 'CG', 'GCG', 'GOE3', 'GOE4', 'BOEL', 'UMOE', 'CECOM'] },
      { id: 'tech-1', name: 'Técnico USAC', username: 'user@picks.pro', password: '123', role: 'USAC', status: 'approved', assignedBuildings: BUILDINGS.map(b => b.id), assignedUnits: ['USAC'], phone: '34600000000', specialty: 'Electricidad' },
      { id: 'unit-1', name: 'Técnico GOE III', username: 'unit@picks.pro', password: '123', role: 'GOE3', status: 'approved', assignedBuildings: BUILDINGS.filter(b => b.unit === 'GOE3').map(b => b.id), assignedUnits: ['GOE3'], phone: '34611111111', specialty: 'Fontanería' }
    ];

    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(initial));
      return initial;
    }
    try {
      const users: User[] = JSON.parse(data);
      if (users.length === 0) {
        localStorage.setItem(USERS_KEY, JSON.stringify(initial));
        return initial;
      }
      // Ensure master exists in the list
      if (!users.find(u => u.role === 'MASTER')) {
        const updated = [initial[0], ...users];
        localStorage.setItem(USERS_KEY, JSON.stringify(updated));
        return updated;
      }
      return users;
    } catch (e) {
      return initial;
    }
  },

  saveUser: (user: User) => {
    const users = storageService.getUsers();
    const updated = [...users, user];
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  updateUserStatus: (userId: string, status: UserStatus, assignedBuildings: string[], assignedUnits: Role[]) => {
    const users = storageService.getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, status, assignedBuildings, assignedUnits } : u);
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  resetUserPassword: (userId: string, newPass: string) => {
    const users = storageService.getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, password: newPass } : u);
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  updateUserLeaveDays: (userId: string, leaveDays: string[]) => {
    const users = storageService.getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, leaveDays } : u);
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  // --- READINGS ---
  getReadings: (buildingId?: string, service?: ServiceType): Reading[] => {
    const data = localStorage.getItem(READINGS_KEY);
    if (!data) return [];
    try {
      let readings: Reading[] = JSON.parse(data);
      if (buildingId) readings = readings.filter(r => r.buildingId === buildingId);
      if (service) readings = readings.filter(r => r.serviceType === service);
      return readings;
    } catch (e) {
      console.error("Error parsing readings", e);
      return [];
    }
  },

  saveReading: (reading: Reading) => {
    const readings = storageService.getReadings();
    if (!reading.consumption1) {
      const prev = readings.filter(r => r.buildingId === reading.buildingId && r.serviceType === reading.serviceType).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      if (prev) {
        reading.consumption1 = reading.value1 - prev.value1;
        if (reading.value2 !== undefined && prev.value2 !== undefined) {
          reading.consumption2 = reading.value2 - prev.value2;
        }
      } else {
        reading.consumption1 = 0;
        reading.consumption2 = 0;
      }
    }
    const updated = [...readings, reading];
    localStorage.setItem(READINGS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  deleteReading: (id: string) => {
    const readings = storageService.getReadings();
    const filtered = readings.filter(r => r.id !== id);
    localStorage.setItem(READINGS_KEY, JSON.stringify(filtered));
    saveToServer();
  },

  // --- REQUESTS ---
  getRequests: (): RequestItem[] => {
    const data = localStorage.getItem(REQUESTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveRequest: (request: RequestItem) => {
    const requests = storageService.getRequests();
    const updated = [request, ...requests];
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  updateRequestStatus: (id: string, status: RequestItem['status'], structuralSolution?: string, workDetails?: RequestItem['workDetails']) => {
    const requests = storageService.getRequests();
    const updated = requests.map(r => r.id === id ? { 
      ...r, 
      status, 
      resolvedAt: status === 'closed' || status === 'resolved_by_ai' ? new Date().toISOString() : r.resolvedAt,
      structuralSolution: structuralSolution || r.structuralSolution,
      workDetails: workDetails || r.workDetails
    } : r);
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  // --- TASKS ---
  getTasks: (): CalendarTask[] => {
    const data = localStorage.getItem(TASKS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveTask: (task: CalendarTask) => {
    const tasks = storageService.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    let updated;
    if (index > -1) {
      tasks[index] = task;
      updated = [...tasks];
    } else {
      updated = [task, ...tasks];
    }
    localStorage.setItem(TASKS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  deleteTask: (id: string) => {
    const tasks = storageService.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    localStorage.setItem(TASKS_KEY, JSON.stringify(filtered));
    saveToServer();
  },

  // --- NOTIFICATIONS ---
  getNotifications: (userId: string): AppNotification[] => {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: AppNotification[] = data ? JSON.parse(data) : [];
    return all.filter(n => n.userId === userId || n.userId === 'any').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addNotification: (notification: AppNotification) => {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: AppNotification[] = data ? JSON.parse(data) : [];
    const updated = [notification, ...all];
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  markNotificationAsRead: (id: string) => {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!data) return;
    const all: AppNotification[] = JSON.parse(data);
    const updated = all.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  clearNotifications: (userId: string) => {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!data) return;
    const all: AppNotification[] = JSON.parse(data);
    const updated = all.filter(n => n.userId !== userId);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  // --- GASOIL ---
  getGasoilTanks: (): GasoilTank[] => {
    const data = localStorage.getItem(GASOIL_TANKS_KEY);
    if (data) return JSON.parse(data);
    
    const initial: GasoilTank[] = BUILDINGS.filter(b => b.hasBoiler).map((b, idx) => ({
      id: `tank-${b.id}`,
      buildingId: b.id,
      buildingCode: b.code,
      buildingName: b.name,
      tankNumber: 1,
      fullName: `Depósito ${b.code}`,
      totalCapacity: 2000,
      currentLevel: 75,
      currentLitres: 1500,
      alertStatus: 'normal',
      daysRemaining: 45
    }));
    localStorage.setItem(GASOIL_TANKS_KEY, JSON.stringify(initial));
    return initial;
  },

  saveGasoilReading: (reading: GasoilReading) => {
    const readings = JSON.parse(localStorage.getItem(GASOIL_READINGS_KEY) || '[]');
    const updatedReadings = [reading, ...readings];
    localStorage.setItem(GASOIL_READINGS_KEY, JSON.stringify(updatedReadings));
    saveToServer();

    // Update Tank
    const tanks = storageService.getGasoilTanks();
    const updatedTanks = tanks.map(t => {
      if (t.id === reading.tankId) {
        let status: GasoilAlertStatus = 'normal';
        if (reading.percentage <= 10) status = 'critico';
        else if (reading.percentage <= 25) status = 'bajo';
        else if (reading.percentage <= 40) status = 'atencion';

        return {
          ...t,
          currentLevel: reading.percentage,
          currentLitres: reading.litres,
          lastReading: reading.date,
          alertStatus: status
        };
      }
      return t;
    });
    localStorage.setItem(GASOIL_TANKS_KEY, JSON.stringify(updatedTanks));
    saveToServer();
  },

  saveRefuelRequest: (request: RefuelRequest) => {
    const requests = JSON.parse(localStorage.getItem(REFUEL_REQUESTS_KEY) || '[]');
    const updated = [request, ...requests];
    localStorage.setItem(REFUEL_REQUESTS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  // --- SALT ---
  getSaltWarehouse: (): SaltWarehouse => {
    const data = localStorage.getItem(SALT_STOCK_KEY);
    return data ? JSON.parse(data) : { sacksAvailable: 25, kgPerSack: 25, minAlertLevel: 10, criticalAlertLevel: 5, status: 'normal' };
  },

  getSaltSofteners: (): SaltSoftener[] => {
    const data = localStorage.getItem(SALT_SOFTENERS_KEY);
    if (data) return JSON.parse(data);
    const initial: SaltSoftener[] = BUILDINGS.filter(b => b.hasBoiler).map(b => ({
      id: `soft-${b.id}`,
      buildingId: b.id,
      buildingCode: b.code,
      buildingName: b.name
    }));
    localStorage.setItem(SALT_SOFTENERS_KEY, JSON.stringify(initial));
    return initial;
  },

  getSaltRefillLogs: (): SaltRefillLog[] => {
    const data = localStorage.getItem(SALT_REFILL_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveSaltRefill: (logData: Omit<SaltRefillLog, 'id' | 'stockBefore' | 'stockAfter'>) => {
    const warehouse = storageService.getSaltWarehouse();
    const stockBefore = warehouse.sacksAvailable;
    const stockAfter = stockBefore - logData.sacksUsed;
    
    const newLog: SaltRefillLog = {
      ...logData,
      id: crypto.randomUUID(),
      stockBefore,
      stockAfter
    };

    const logs = storageService.getSaltRefillLogs();
    const updatedLogs = [newLog, ...logs];
    localStorage.setItem(SALT_REFILL_LOGS_KEY, JSON.stringify(updatedLogs));
    saveToServer();

    warehouse.sacksAvailable = stockAfter;
    if (stockAfter <= warehouse.criticalAlertLevel) warehouse.status = 'critico';
    else if (stockAfter <= warehouse.minAlertLevel) warehouse.status = 'bajo';
    else warehouse.status = 'normal';
    localStorage.setItem(SALT_STOCK_KEY, JSON.stringify(warehouse));
    saveToServer();

    const softeners = storageService.getSaltSofteners();
    const updatedSoft = softeners.map(s => s.id === logData.softenerId ? { ...s, lastRefillDate: logData.date, lastRefillSacks: logData.sacksUsed } : s);
    localStorage.setItem(SALT_SOFTENERS_KEY, JSON.stringify(updatedSoft));
    saveToServer();
  },

  saveSaltEntry: (log: Omit<SaltEntryLog, 'id'>) => {
    const newLog: SaltEntryLog = { ...log, id: crypto.randomUUID() };
    const logs = JSON.parse(localStorage.getItem(SALT_ENTRY_LOGS_KEY) || '[]');
    const updatedLogs = [newLog, ...logs];
    localStorage.setItem(SALT_ENTRY_LOGS_KEY, JSON.stringify(updatedLogs));
    saveToServer();

    const warehouse = storageService.getSaltWarehouse();
    warehouse.sacksAvailable += log.sacksReceived;
    warehouse.lastSupplier = log.supplier;
    if (warehouse.sacksAvailable > warehouse.minAlertLevel) warehouse.status = 'normal';
    localStorage.setItem(SALT_STOCK_KEY, JSON.stringify(warehouse));
    saveToServer();
  },

  // --- BOILERS ---
  getBoilers: (): Boiler[] => {
    const data = localStorage.getItem(BOILERS_KEY);
    if (data) return JSON.parse(data);

    const initial: Boiler[] = BUILDINGS.filter(b => b.hasBoiler).map(b => ({
      id: `cal-${b.id}`,
      buildingId: b.id,
      buildingCode: b.code,
      buildingName: b.name,
      code: `CAL-${b.code}`,
      brand: 'Ferroli',
      powerKw: 150,
      status: 'operativa',
      refTemps: {
        impulsionMin: 60,
        impulsionMax: 80,
        pressureMin: 1.0,
        pressureMax: 2.0
      }
    }));
    localStorage.setItem(BOILERS_KEY, JSON.stringify(initial));
    return initial;
  },

  updateBoilerStatus: (id: string, status: BoilerStatus) => {
    const boilers = storageService.getBoilers();
    const updated = boilers.map(b => b.id === id ? { ...b, status } : b);
    localStorage.setItem(BOILERS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  getBoilerReadings: (boilerId?: string): BoilerTemperatureReading[] => {
    const data = localStorage.getItem(BOILER_READINGS_KEY);
    let readings: BoilerTemperatureReading[] = data ? JSON.parse(data) : [];
    if (boilerId) readings = readings.filter(r => r.boilerId === boilerId);
    return readings.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  saveBoilerReading: (reading: BoilerTemperatureReading) => {
    const readings = storageService.getBoilerReadings();
    const updated = [reading, ...readings];
    localStorage.setItem(BOILER_READINGS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  getBoilerMaintenance: (boilerId?: string): BoilerMaintenanceRecord[] => {
    const data = localStorage.getItem(BOILER_MAINTENANCE_KEY);
    let records: BoilerMaintenanceRecord[] = data ? JSON.parse(data) : [];
    if (boilerId) records = records.filter(r => r.boilerId === boilerId);
    return records.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  saveBoilerMaintenance: (record: BoilerMaintenanceRecord) => {
    const records = storageService.getBoilerMaintenance();
    const updated = [record, ...records];
    localStorage.setItem(BOILER_MAINTENANCE_KEY, JSON.stringify(updated));
    saveToServer();
    storageService.updateBoilerStatus(record.boilerId, record.statusAfter);
  },

  saveExternalContact: (contact: ExternalUser) => {
    const data = localStorage.getItem(EXTERNAL_CONTACTS_KEY);
    const all: ExternalUser[] = data ? JSON.parse(data) : [];
    const updated = [contact, ...all];
    localStorage.setItem(EXTERNAL_CONTACTS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  getExternalContacts: (): ExternalUser[] => {
    const data = localStorage.getItem(EXTERNAL_CONTACTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // --- MATERIAL MANAGEMENT ---
  getNextRegistrationNumber: (): string => {
    const requests = storageService.getRequests();
    const year = new Date().getFullYear();
    const prefix = `MAT-${year}-`;
    const yearRequests = requests.filter(r => r.registrationNumber?.startsWith(prefix));
    
    let nextNum = 1;
    if (yearRequests.length > 0) {
      const numbers = yearRequests.map(r => {
        const parts = r.registrationNumber?.split('-');
        return parts ? parseInt(parts[parts.length - 1]) : 0;
      });
      nextNum = Math.max(...numbers) + 1;
    }
    
    return `${prefix}${nextNum.toString().padStart(3, '0')}`;
  },

  getProviders: (): Provider[] => {
    const data = localStorage.getItem(PROVIDERS_KEY);
    if (!data) {
      const initial: Provider[] = [
        {
          id: 'prov-1',
          name: 'Ferretería Industrial García',
          phone: '965123456',
          email: 'pedidos@ferreteriagarcia.es',
          categories: ['ferreteria', 'electricidad', 'fontaneria'],
          isPreferred: true,
          rating: 4.5,
          totalOrders: 12,
          hasCustomerAccount: true,
          generalDiscount: 10,
          deliveryTimeDays: 1,
          doesShipping: true,
          status: 'activo',
          createdAt: new Date().toISOString()
        },
        {
          id: 'prov-2',
          name: 'Suministros Eléctricos Levante',
          phone: '965234567',
          email: 'ventas@sellevante.com',
          categories: ['electricidad'],
          isPreferred: true,
          rating: 4.8,
          totalOrders: 8,
          hasCustomerAccount: true,
          generalDiscount: 15,
          deliveryTimeDays: 2,
          doesShipping: true,
          status: 'activo',
          createdAt: new Date().toISOString()
        },
        {
          id: 'prov-3',
          name: 'Fontanería Hermanos López',
          phone: '965345678',
          email: 'info@fontanerialopez.es',
          categories: ['fontaneria', 'climatizacion'],
          isPreferred: false,
          rating: 4.0,
          totalOrders: 5,
          hasCustomerAccount: false,
          generalDiscount: 0,
          deliveryTimeDays: 1,
          doesShipping: true,
          status: 'activo',
          createdAt: new Date().toISOString()
        },
        {
          id: 'prov-4',
          name: 'Pinturas y Decoración Alicante',
          phone: '965456789',
          email: 'pedidos@pinturasalicante.com',
          categories: ['pintura', 'ferreteria'],
          isPreferred: false,
          rating: 4.2,
          totalOrders: 3,
          hasCustomerAccount: false,
          generalDiscount: 5,
          deliveryTimeDays: 2,
          doesShipping: true,
          status: 'activo',
          createdAt: new Date().toISOString()
        },
        {
          id: 'prov-5',
          name: 'Suministros de Oficina Express',
          phone: '965567890',
          email: 'pedidos@oficinaexpress.es',
          categories: ['oficina', 'limpieza'],
          isPreferred: true,
          rating: 4.7,
          totalOrders: 15,
          hasCustomerAccount: true,
          generalDiscount: 12,
          deliveryTimeDays: 1,
          doesShipping: true,
          status: 'activo',
          createdAt: new Date().toISOString()
        },
        {
          id: 'prov-6',
          name: 'Bricomart Alicante',
          phone: '965678901',
          email: 'atencion@bricomart.es',
          categories: ['ferreteria', 'electricidad', 'fontaneria', 'pintura', 'jardineria', 'construccion'],
          isPreferred: false,
          rating: 3.8,
          totalOrders: 20,
          hasCustomerAccount: false,
          generalDiscount: 0,
          deliveryTimeDays: 1,
          doesShipping: false,
          status: 'activo',
          createdAt: new Date().toISOString()
        },
        {
          id: 'prov-7',
          name: 'Leroy Merlin San Juan',
          phone: '965789012',
          email: 'sanjuan@leroymerlin.es',
          categories: ['ferreteria', 'electricidad', 'fontaneria', 'pintura', 'jardineria', 'carpinteria'],
          isPreferred: false,
          rating: 3.9,
          totalOrders: 18,
          hasCustomerAccount: false,
          generalDiscount: 0,
          deliveryTimeDays: 1,
          doesShipping: true,
          status: 'activo',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(PROVIDERS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },

  getCategories: (): MaterialCategory[] => {
    const data = localStorage.getItem(CATEGORIES_KEY);
    if (!data) {
      const initial: MaterialCategory[] = [
        { id: 'cat-1', name: 'ferreteria', icon: '🔧', color: '#6b7280', order: 1 },
        { id: 'cat-2', name: 'fontaneria', icon: '🚰', color: '#3b82f6', order: 2 },
        { id: 'cat-3', name: 'electricidad', icon: '⚡', color: '#f59e0b', order: 3 },
        { id: 'cat-4', name: 'climatizacion', icon: '❄️', color: '#06b6d4', order: 4 },
        { id: 'cat-5', name: 'pintura', icon: '🎨', color: '#ec4899', order: 5 },
        { id: 'cat-6', name: 'limpieza', icon: '🧹', color: '#10b981', order: 6 },
        { id: 'cat-7', name: 'jardineria', icon: '🌱', color: '#22c55e', order: 7 },
        { id: 'cat-8', name: 'oficina', icon: '📎', color: '#8b5cf6', order: 8 },
        { id: 'cat-9', name: 'seguridad', icon: '🔒', color: '#ef4444', order: 9 },
        { id: 'cat-10', name: 'construccion', icon: '🧱', color: '#78716c', order: 10 },
        { id: 'cat-11', name: 'carpinteria', icon: '🪵', color: '#a16207', order: 11 },
        { id: 'cat-12', name: 'informatica', icon: '💻', color: '#0ea5e9', order: 12 },
        { id: 'cat-13', name: 'otros', icon: '📦', color: '#9ca3af', order: 99 }
      ];
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },

  saveProvider: (provider: Provider) => {
    const providers = storageService.getProviders();
    const updated = [provider, ...providers];
    localStorage.setItem(PROVIDERS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  updateProvider: (provider: Provider) => {
    const providers = storageService.getProviders();
    const updated = providers.map(p => p.id === provider.id ? provider : p);
    localStorage.setItem(PROVIDERS_KEY, JSON.stringify(updated));
    saveToServer();
  },

  findProvider: (query: { name?: string, email?: string, phone?: string, cif?: string }): Provider | null => {
    const providers = storageService.getProviders();
    return providers.find(p => 
      (query.cif && p.cif && p.cif.toUpperCase().replace(/[^A-Z0-9]/g, '') === query.cif.toUpperCase().replace(/[^A-Z0-9]/g, '')) ||
      (query.name && p.name.toLowerCase() === query.name.toLowerCase()) ||
      (query.email && p.email && p.email.toLowerCase() === query.email.toLowerCase()) ||
      (query.phone && p.phone && p.phone.replace(/\s/g, '') === query.phone.replace(/\s/g, ''))
    ) || null;
  }
};
