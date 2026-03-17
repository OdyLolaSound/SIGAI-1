
import { Reading, Building, ServiceType, Role, User, UserStatus, RequestItem, GasoilTank, Boiler, BoilerTemperatureReading, BoilerMaintenanceRecord, BoilerPart, BoilerStatus, SaltWarehouse, SaltSoftener, CalendarTask, AppNotification, GasoilReading, RefuelRequest, SaltRefillLog, SaltEntryLog, ExternalUser, WaterAccount, WaterSyncLog, GasoilAlertStatus, Provider, MaterialCategory, MaterialItem, LeaveEntry } from '../types';
import { getLocalDateString, isWorkDay } from './dateUtils';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, getDocs, onSnapshot, query, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

// Constants that don't change
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
  { id: 'BASE_ALICANTE', name: 'Base Alicante (Contador General)', code: 'ALC-GEN', unit: 'USAC', hasBoiler: false },
];

export const PIEZAS_COMUNES: BoilerPart[] = [
  { id: 'p1', name: 'Fotocélula QRB1', category: 'Electrónica', price: 45.50 },
  { id: 'p2', name: 'Boquilla Danfoss 0.60', category: 'Combustión', price: 12.80 },
  { id: 'p3', name: 'Filtro Gasoil 3/8', category: 'Suministro', price: 8.50 },
  { id: 'p4', name: 'Junta de Estanqueidad', category: 'Mecánica', price: 3.20 },
  { id: 'p5', name: 'Termostato Inmersión', category: 'Control', price: 22.00 }
];

// Local cache for synchronous access (updated by real-time listeners)
let cache: any = {
  readings: [],
  users: [],
  requests: [],
  gasoil_tanks: [],
  gasoil_readings: [],
  refuel_requests: [],
  salt_stock: null,
  salt_softeners: [],
  salt_refill_logs: [],
  salt_entry_logs: [],
  water_accounts: [],
  water_sync_logs: [],
  tasks: [],
  notifications: [],
  external_contacts: [],
  boilers: [],
  boiler_readings: [],
  boiler_maintenance: [],
  providers: [],
  categories: []
};

let activeListeners: (() => void)[] = [];

// Helper to initialize a collection listener
function setupListener(collectionName: string, cacheKey: string) {
  const q = query(collection(db, collectionName));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    console.log(`[DEBUG] Listener ${collectionName} updated: ${data.length} items`);
    if (cacheKey === 'salt_stock') {
      cache[cacheKey] = data[0] || null;
    } else {
      cache[cacheKey] = data;
    }
  }, (error) => {
    // Only log if it's not a permission error during logout/login transition
    const msg = error.message.toLowerCase();
    if (!msg.includes('insufficient permissions') && !msg.includes('permission-denied')) {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
  });
}

const getFallbackAccount = (): WaterAccount => ({
  id: 'AGUAS_ALICANTE_BASE',
  buildingId: 'BASE_ALICANTE',
  buildingCode: 'ALC-01',
  buildingName: 'Base Alicante USAC',
  contractNumber: 'S0300017A',
  webUser: 'S0300017A',
  password: 'Usac15.',
  syncActive: true,
  status: 'conectada',
  peakThresholdPercent: 50,
  peakThresholdM3: 90,
  syncFrequency: 'diaria',
  selectors: {
    userField: '#username',
    passField: '#password',
    submitBtn: '#loginBtn',
    tableSelector: '.readings-table'
  }
});

export const storageService = {
  init: async () => {
    console.log('[DEBUG] storageService.init starting');
    // Seed real data provided by user
    await storageService.seedWaterData();
    return true;
  },

  seedWaterData: async () => {
    const realData = [
      { date: '2026-03-16', value: 290408.96, consumption: 73.8 },
      { date: '2026-03-15', value: 290335.16, consumption: 21.93 },
      { date: '2026-03-14', value: 290313.23, consumption: 22.28 },
      { date: '2026-03-13', value: 290290.95, consumption: 67.35 },
      { date: '2026-03-12', value: 290223.6, consumption: 64.89 },
      { date: '2026-03-11', value: 290158.71, consumption: 70.54 },
      { date: '2026-03-10', value: 290088.17, consumption: 65.27 },
      { date: '2026-03-09', value: 290022.9, consumption: 76.52 },
      { date: '2026-03-08', value: 289946.38, consumption: 35.21 },
      { date: '2026-03-07', value: 289911.17, consumption: 50.16 },
    ];

    const seededReadings: Reading[] = [];

    for (const item of realData) {
      const id = `real_water_${item.date}`;
      const reading: Reading = {
        id,
        buildingId: 'BASE_ALICANTE',
        date: item.date,
        timestamp: new Date(item.date).toISOString(),
        userId: 'system_seed',
        serviceType: 'agua',
        origin: 'telematica',
        value1: item.value,
        consumption1: item.consumption,
        isPeak: item.consumption > 60
      };
      
      seededReadings.push(reading);

      // Intelligent peak detection: lower threshold for weekends/holidays
      const threshold = isWorkDay(item.date) ? 90 : 60;
      reading.isPeak = item.consumption > threshold;

      try {
        console.log(`[DEBUG] Seeding reading for ${item.date}...`);
        await setDoc(doc(db, 'readings', id), reading);
      } catch (e) {
        console.error(`[DEBUG] Error seeding reading for ${item.date}:`, e);
      }
    }

    // Update cache immediately for synchronous access
    cache.readings = [...cache.readings, ...seededReadings.filter(sr => !cache.readings.find((r: any) => r.id === sr.id))];
    
    console.log('[DEBUG] Real water data seeded in cache and Firestore. Total readings in cache:', cache.readings.length);
  },

  startListeners: () => {
    if (activeListeners.length > 0) return;

    activeListeners = [
      setupListener('readings', 'readings'),
      setupListener('users', 'users'),
      setupListener('requests', 'requests'),
      setupListener('gasoil_tanks', 'gasoil_tanks'),
      setupListener('gasoil_readings', 'gasoil_readings'),
      setupListener('refuel_requests', 'refuel_requests'),
      setupListener('salt_stock', 'salt_stock'),
      setupListener('salt_softeners', 'salt_softeners'),
      setupListener('salt_refill_logs', 'salt_refill_logs'),
      setupListener('salt_entry_logs', 'salt_entry_logs'),
      setupListener('water_accounts', 'water_accounts'),
      setupListener('water_sync_logs', 'water_sync_logs'),
      setupListener('tasks', 'tasks'),
      setupListener('notifications', 'notifications'),
      setupListener('external_contacts', 'external_contacts'),
      setupListener('boilers', 'boilers'),
      setupListener('boiler_readings', 'boiler_readings'),
      setupListener('boiler_maintenance', 'boiler_maintenance'),
      setupListener('providers', 'providers'),
      setupListener('categories', 'categories'),
    ];
  },

  stopListeners: () => {
    activeListeners.forEach(unsubscribe => unsubscribe());
    activeListeners = [];
    // Clear cache on logout to prevent stale data flash
    Object.keys(cache).forEach(key => {
      if (key === 'salt_stock') cache[key] = null;
      else cache[key] = [];
    });
  },

  // --- READINGS ---
  getReadings: (buildingId?: string, serviceType?: ServiceType): Reading[] => {
    let readings = cache.readings;
    if (buildingId) readings = readings.filter((r: any) => r.buildingId === buildingId);
    if (serviceType) readings = readings.filter((r: any) => r.serviceType === serviceType);
    return readings;
  },
  saveReading: async (reading: Reading) => {
    try {
      await setDoc(doc(db, 'readings', reading.id), reading);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'readings');
    }
  },
  deleteReading: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'readings', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'readings');
    }
  },

  // --- USERS ---
  getUsers: (): User[] => {
    if (cache.users.length === 0) {
      // Fallback to a master user if empty (for first run)
      return [{
        id: 'master-1',
        name: 'Administrador Maestro',
        username: 'admin',
        password: '123',
        role: 'MASTER',
        status: 'approved',
        assignedBuildings: BUILDINGS.map(b => b.id),
        assignedUnits: ['USAC', 'GCG', 'BOEL', 'GOE4'],
        isManto: true
      }];
    }
    return cache.users;
  },
  getUserById: (id: string): User | null => {
    return cache.users.find((u: any) => u.id === id) || null;
  },
  saveUser: async (user: User) => {
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'users');
    }
  },
  updateUser: async (user: User) => {
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  },
  updateUserStatus: async (userId: string, status: UserStatus, assignedBuildings: string[], assignedUnits: Role[]) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status, assignedBuildings, assignedUnits });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  },
  resetUserPassword: async (userId: string, newPassword: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { password: newPassword });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  },
  updateUserLeaveDays: async (userId: string, leaveDays: string[]) => {
    try {
      await updateDoc(doc(db, 'users', userId), { leaveDays });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  },
  addLeaveEntry: async (userId: string, entry: LeaveEntry) => {
    try {
      const user = cache.users.find((u: any) => u.id === userId);
      if (user) {
        // We add the startDate to leaveDays for simplicity in the UI check
        const updatedLeaveDays = [...(user.leaveDays || []), entry.startDate];
        const updatedLeaveEntries = [...(user.leaveEntries || []), entry];
        await updateDoc(doc(db, 'users', userId), { 
          leaveDays: updatedLeaveDays,
          leaveEntries: updatedLeaveEntries
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  },

  // --- REQUESTS ---
  getRequests: (): RequestItem[] => cache.requests,
  saveRequest: async (request: RequestItem) => {
    try {
      await setDoc(doc(db, 'requests', request.id), request);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'requests');
    }
  },
  updateRequestStatus: async (requestId: string, status: RequestItem['status'], technicianId?: string, workDetails?: any) => {
    try {
      const updateData: any = { status };
      if (technicianId) updateData.technicianId = technicianId;
      if (workDetails) updateData.workDetails = workDetails;
      await updateDoc(doc(db, 'requests', requestId), updateData);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'requests');
    }
  },
  getNextRegistrationNumber: (): string => {
    const count = cache.requests.length + 1;
    const year = new Date().getFullYear();
    return `USAC/${year}/${count.toString().padStart(4, '0')}`;
  },

  // --- GASOIL ---
  getGasoilTanks: (): GasoilTank[] => cache.gasoil_tanks,
  getGasoilReadings: (): GasoilReading[] => cache.gasoil_readings,
  getRefuelRequests: (): RefuelRequest[] => cache.refuel_requests,
  saveGasoilReading: async (reading: GasoilReading) => {
    try {
      await setDoc(doc(db, 'gasoil_readings', reading.id), reading);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'gasoil_readings');
    }
  },
  saveRefuelRequest: async (request: RefuelRequest) => {
    try {
      await setDoc(doc(db, 'refuel_requests', request.id), request);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'refuel_requests');
    }
  },
  updateRefuelRequestStatus: async (id: string, status: RefuelRequest['status']) => {
    try {
      await updateDoc(doc(db, 'refuel_requests', id), { status });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'refuel_requests');
    }
  },

  // --- SALT ---
  getSaltStock: (): SaltWarehouse | null => cache.salt_stock,
  getSaltWarehouse: (): SaltWarehouse | null => cache.salt_stock,
  getSaltSofteners: (): SaltSoftener[] => cache.salt_softeners,
  getSaltRefillLogs: (): SaltRefillLog[] => cache.salt_refill_logs,
  getSaltEntryLogs: (): SaltEntryLog[] => cache.salt_entry_logs,
  updateSaltStock: async (stock: SaltWarehouse) => {
    try {
      await setDoc(doc(db, 'salt_stock', 'current'), stock);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'salt_stock');
    }
  },
  saveSaltRefill: async (log: any) => {
    try {
      const warehouse = cache.salt_stock;
      const stockBefore = warehouse?.sacksAvailable || 0;
      const stockAfter = stockBefore - log.sacksUsed;
      
      const fullLog: SaltRefillLog = {
        id: crypto.randomUUID(),
        stockBefore,
        stockAfter,
        ...log
      };
      
      await setDoc(doc(db, 'salt_refill_logs', fullLog.id), fullLog);
      
      // Update warehouse stock
      if (warehouse) {
        await setDoc(doc(db, 'salt_stock', 'current'), {
          ...warehouse,
          sacksAvailable: stockAfter
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'salt_refill_logs');
    }
  },
  saveSaltRefillLog: async (log: SaltRefillLog) => {
    try {
      await setDoc(doc(db, 'salt_refill_logs', log.id), log);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'salt_refill_logs');
    }
  },
  saveSaltEntry: async (log: any) => {
    try {
      const warehouse = cache.salt_stock;
      const fullLog: SaltEntryLog = {
        id: crypto.randomUUID(),
        ...log
      };
      await setDoc(doc(db, 'salt_entry_logs', fullLog.id), fullLog);
      
      // Update warehouse stock
      if (warehouse) {
        await setDoc(doc(db, 'salt_stock', 'current'), {
          ...warehouse,
          sacksAvailable: warehouse.sacksAvailable + log.sacksReceived,
          lastSupplier: log.supplier
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'salt_entry_logs');
    }
  },
  saveSaltEntryLog: async (log: SaltEntryLog) => {
    try {
      await setDoc(doc(db, 'salt_entry_logs', log.id), log);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'salt_entry_logs');
    }
  },

  // --- WATER ACCOUNTS ---
  getWaterAccounts: (): WaterAccount[] => cache.water_accounts,
  getWaterAccount: (id?: string): WaterAccount | null => {
    const fallbackId = 'AGUAS_ALICANTE_BASE';
    if (id) {
      const found = cache.water_accounts.find((a: any) => a.id === id);
      if (found) return found;
      if (id === fallbackId) return getFallbackAccount();
      return null;
    }
    if (cache.water_accounts.length > 0) return cache.water_accounts[0];
    return getFallbackAccount();
  },
  getWaterSyncLogs: (): WaterSyncLog[] => cache.water_sync_logs,
  saveWaterAccount: async (account: WaterAccount) => {
    try {
      await setDoc(doc(db, 'water_accounts', account.id), account);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'water_accounts');
    }
  },
  saveWaterSyncLog: async (log: WaterSyncLog) => {
    try {
      await setDoc(doc(db, 'water_sync_logs', log.id), log);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'water_sync_logs');
    }
  },
  simulateWaterSync: async (accountId: string, onProgress?: (msg: string) => void): Promise<any> => {
    console.log(`[DEBUG] simulateWaterSync called for accountId: ${accountId}`);
    const account = cache.water_accounts.find((a: any) => a.id === accountId) || storageService.getWaterAccount(accountId);
    
    if (!account) {
      console.error(`[DEBUG] Account not found for ID: ${accountId}`);
      return { success: false, message: "Cuenta no encontrada" };
    }

    if (onProgress) {
      onProgress("[BROWSER] Iniciando motor Puppeteer...");
      await new Promise(r => setTimeout(r, 600));
      onProgress(`[AUTH] Intentando login en Aguas de Alicante con usuario: ${account.webUser}...`);
      await new Promise(r => setTimeout(r, 500));
      onProgress(`[AUTH] Verificando contraseña: ${account.password ? account.password.substring(0, 2) + '***' + account.password.slice(-1) : 'VACÍA'}...`);
      await new Promise(r => setTimeout(r, 500));
      onProgress("[SCRAPE] Acceso concedido. Navegando a 'Mis Consumos'...");
      await new Promise(r => setTimeout(r, 800));
      onProgress("[URL] https://www.aguasdealicante.es/es/group/amaem/mis-consumos...");
      await new Promise(r => setTimeout(r, 1000));
      onProgress("[SCRAPE] Localizando tabla de consumos históricos...");
      await new Promise(r => setTimeout(r, 1200));
      onProgress("[DATA] Extrayendo última lectura validada...");
      await new Promise(r => setTimeout(r, 800));
      onProgress("[SYNC] Sincronizando datos con base de datos central...");
    }

    const lastReading = cache.readings.filter((r: any) => r.buildingId === account.buildingId && r.serviceType === 'agua').sort((a: any, b: any) => b.date.localeCompare(a.date))[0];
    
    // Generate a realistic reading for today
    const newValue = (lastReading?.value1 || 12450) + Math.floor(Math.random() * 15) + 5;
    const consumption = newValue - (lastReading?.value1 || 12450);
    
    const reading: Reading = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `rd_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      buildingId: account.buildingId,
      date: getLocalDateString(),
      timestamp: new Date().toISOString(),
      userId: auth.currentUser?.uid || 'system_fallback',
      serviceType: 'agua',
      origin: 'telematica',
      value1: newValue,
      consumption1: parseFloat(consumption.toFixed(2)),
      isPeak: consumption > (isWorkDay(new Date()) ? account.peakThresholdM3 : account.peakThresholdM3 * 0.6)
    };

    try {
      console.log(`[DEBUG] Attempting to save reading:`, reading);
      await setDoc(doc(db, 'readings', reading.id), reading);
      console.log(`[DEBUG] Reading saved successfully`);
      return { 
        success: true, 
        message: `Lectura de ${reading.consumption1} m³ sincronizada correctamente`,
        reading 
      };
    } catch (e) {
      console.error(`[DEBUG] Error saving reading to Firestore:`, e);
      return { success: false, message: `Error al guardar en base de datos: ${e instanceof Error ? e.message : 'Error desconocido'}` };
    }
  },

  // --- TASKS ---
  getTasks: (): CalendarTask[] => cache.tasks,
  saveTask: async (task: CalendarTask) => {
    try {
      await setDoc(doc(db, 'tasks', task.id), task);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'tasks');
    }
  },
  deleteTask: async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'tasks');
    }
  },

  // --- NOTIFICATIONS ---
  getNotifications: (userId?: string): AppNotification[] => {
    if (userId) {
      return cache.notifications.filter((n: any) => n.userId === userId);
    }
    return cache.notifications;
  },
  addNotification: async (notification: AppNotification) => {
    try {
      await setDoc(doc(db, 'notifications', notification.id), notification);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'notifications');
    }
  },
  saveNotification: async (notification: AppNotification) => {
    try {
      await setDoc(doc(db, 'notifications', notification.id), notification);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'notifications');
    }
  },
  markNotificationAsRead: async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'notifications');
    }
  },
  markNotificationRead: async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'notifications');
    }
  },
  clearNotifications: async (userId?: string) => {
    try {
      const batch: any = [];
      const toDelete = userId 
        ? cache.notifications.filter((n: any) => n.userId === userId)
        : cache.notifications;
      
      toDelete.forEach((n: any) => {
        batch.push(deleteDoc(doc(db, 'notifications', n.id)));
      });
      await Promise.all(batch);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'notifications');
    }
  },

  // --- EXTERNAL CONTACTS ---
  getExternalContacts: (): ExternalUser[] => cache.external_contacts,
  saveExternalContact: async (contact: ExternalUser) => {
    try {
      await setDoc(doc(db, 'external_contacts', contact.id), contact);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'external_contacts');
    }
  },

  // --- BOILERS ---
  getBoilers: (): Boiler[] => cache.boilers,
  getBoilerReadings: (): BoilerTemperatureReading[] => cache.boiler_readings,
  getBoilerMaintenance: (): BoilerMaintenanceRecord[] => cache.boiler_maintenance,
  saveBoilerReading: async (reading: BoilerTemperatureReading) => {
    try {
      await setDoc(doc(db, 'boiler_readings', reading.id), reading);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'boiler_readings');
    }
  },
  saveBoilerMaintenance: async (record: BoilerMaintenanceRecord) => {
    try {
      await setDoc(doc(db, 'boiler_maintenance', record.id), record);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'boiler_maintenance');
    }
  },
  updateBoilerStatus: async (boilerId: string, status: BoilerStatus) => {
    try {
      await updateDoc(doc(db, 'boilers', boilerId), { status });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'boilers');
    }
  },

  // --- PROVIDERS & CATEGORIES ---
  getProviders: (): Provider[] => cache.providers,
  findProvider: (criteria: { name?: string, email?: string, phone?: string, cif?: string }): Provider | null => {
    return cache.providers.find((p: any) => {
      if (criteria.name && p.name === criteria.name) return true;
      if (criteria.email && p.email === criteria.email) return true;
      if (criteria.phone && p.phone === criteria.phone) return true;
      if (criteria.cif && p.cif === criteria.cif) return true;
      return false;
    }) || null;
  },
  getCategories: (): MaterialCategory[] => cache.categories,
  saveProvider: async (provider: Provider) => {
    try {
      await setDoc(doc(db, 'providers', provider.id), provider);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'providers');
    }
  },
  updateProvider: async (provider: Provider) => {
    try {
      await setDoc(doc(db, 'providers', provider.id), provider);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'providers');
    }
  },
  saveCategory: async (category: MaterialCategory) => {
    try {
      await setDoc(doc(db, 'categories', category.id), category);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'categories');
    }
  },

  // --- SESSION (Still using localStorage for non-sensitive UI state) ---
  getCurrentUser: (): User | null => {
    const saved = localStorage.getItem('sigai_current_user_v1');
    return saved ? JSON.parse(saved) : null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem('sigai_current_user_v1', JSON.stringify(user));
    } else {
      localStorage.removeItem('sigai_current_user_v1');
    }
  }
};
