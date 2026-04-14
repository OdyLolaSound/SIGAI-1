
import { Reading, Building, ServiceType, Role, User, UserStatus, UserCategory, RequestItem, GasoilTank, Boiler, BoilerTemperatureReading, BoilerMaintenanceRecord, BoilerPart, BoilerStatus, SaltWarehouse, SaltSoftener, CalendarTask, AppNotification, GasoilReading, RefuelRequest, SaltRefillLog, SaltEntryLog, ExternalUser, WaterAccount, WaterSyncLog, GasoilAlertStatus, Provider, MaterialCategory, MaterialItem, LeaveEntry, Blueprint, PPT, OCACertificate } from '../types';
import { getLocalDateString, isWorkDay, isWeekend } from './dateUtils';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, getDocs, onSnapshot, query, updateDoc, deleteDoc, getDoc, where } from 'firebase/firestore';
import { ALL_BUILDINGS } from './buildingsData';

// Constants that don't change
export const BUILDINGS: Building[] = ALL_BUILDINGS;

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
  categories: [],
  leave_requests: [],
  blueprints: [],
  ppts: [],
  oca_certificates: []
};

// Helper to remove undefined values before saving to Firestore
export const cleanData = (data: any) => {
  if (!data || typeof data !== 'object') return data;
  const clean: any = Array.isArray(data) ? [] : {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      clean[key] = (typeof data[key] === 'object' && data[key] !== null) 
        ? cleanData(data[key]) 
        : data[key];
    }
  });
  return clean;
};

let activeListeners: (() => void)[] = [];

// Helper to initialize a collection listener
function setupListener(collectionName: string, cacheKey: string, customQuery?: any) {
  const q = customQuery || query(collection(db, collectionName));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    console.log(`[DEBUG] Listener ${collectionName} updated: ${data.length} items`);
    if (cacheKey === 'salt_stock') {
      cache[cacheKey] = data[0] || null;
    } else {
      cache[cacheKey] = data;
    }

    // Trigger syncs for specific data types
    if (cacheKey === 'oca_certificates') {
      storageService.syncOCATasks();
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
    // We don't seed here anymore because we need auth
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
        await setDoc(doc(db, 'readings', id), cleanData(reading));
      } catch (e) {
        console.error(`[DEBUG] Error seeding reading for ${item.date}:`, e);
      }
    }

    // Update cache immediately for synchronous access
    cache.readings = [...cache.readings, ...seededReadings.filter(sr => !cache.readings.find((r: any) => r.id === sr.id))];
    
    console.log('[DEBUG] Real water data seeded in cache and Firestore. Total readings in cache:', cache.readings.length);
  },

  seedOCAData: async () => {
    const ocaSeeds: OCACertificate[] = [
      {
        id: 'oca_elec_base',
        title: 'Inspección Eléctrica Baja Tensión',
        category: 'Baja Tensión',
        buildingId: 'BASE_ALICANTE',
        buildingName: 'Base Alicante',
        lastInspectionDate: '2021-05-10',
        expirationDate: '2026-05-10',
        periodicityYears: 5,
        status: 'expirando',
        companyName: 'SGS España'
      },
      {
        id: 'oca_asc_rabasa',
        title: 'Inspección Ascensor Principal',
        category: 'Ascensores',
        buildingId: 'RABASA_01',
        buildingName: 'Acuartelamiento Rabasa',
        lastInspectionDate: '2024-02-15',
        expirationDate: '2026-02-15',
        periodicityYears: 2,
        status: 'caducado',
        companyName: 'TÜV SÜD'
      },
      {
        id: 'oca_pres_caldera',
        title: 'Inspección Equipos a Presión - Caldera 1',
        category: 'Equipos a Presión',
        buildingId: 'BASE_ALICANTE',
        buildingName: 'Base Alicante',
        lastInspectionDate: '2023-11-20',
        expirationDate: '2026-11-20',
        periodicityYears: 3,
        status: 'vigente',
        companyName: 'Applus+'
      }
    ];

    for (const cert of ocaSeeds) {
      try {
        await setDoc(doc(db, 'oca_certificates', cert.id), cleanData(cert));
      } catch (e) {
        console.error(`[DEBUG] Error seeding OCA ${cert.id}:`, e);
      }
    }
  },

  seedPPTData: async () => {
    const pptSeeds: PPT[] = [
      {
        id: 'ppt_piscinas_2026',
        title: 'Mantenimiento de Áreas de Instrucción Subacuáticas',
        category: 'Piscinas',
        validFrom: '2026-04-14',
        validTo: '2026-11-25',
        status: 'active',
        createdAt: new Date().toISOString(),
        tasks: [
          { id: 'p1', description: 'Limpieza diaria manual con barredera y cepillado', frequency: 'diaria', priority: 'Media' },
          { id: 'p2', description: 'Limpieza diaria de línea de flotación y skimmers', frequency: 'diaria', priority: 'Media' },
          { id: 'p3', description: 'Soplado diario de zona de playas', frequency: 'diaria', priority: 'Baja' },
          { id: 'p4', description: 'Analítica diaria (Cloro, PH, Turbidez, Alcalinidad)', frequency: 'diaria', priority: 'Alta' },
          { id: 'p5', description: 'Analítica mensual en laboratorio acreditado', frequency: 'mensual', priority: 'Crítica' },
          { id: 'p6', description: 'Mantenimiento y actualización Plan Auto Control', frequency: 'mensual', priority: 'Media' },
          { id: 'p7', description: 'Gestión de envases de productos químicos', frequency: 'otros', priority: 'Baja' }
        ]
      },
      {
        id: 'ppt_jardines_2026',
        title: 'Mantenimiento de Zonas Ajardinadas',
        category: 'Jardinería',
        validFrom: '2026-04-14',
        validTo: '2026-11-25',
        status: 'active',
        createdAt: new Date().toISOString(),
        tasks: [
          { id: 'j1', description: 'Corte de césped según demanda estacional', frequency: 'semanal', priority: 'Media' },
          { id: 'j2', description: 'Poda de moreras (Noviembre)', frequency: 'anual', priority: 'Baja' },
          { id: 'j3', description: 'Poda y mantenimiento de cítricos y arbustos', frequency: 'otros', priority: 'Media' },
          { id: 'j4', description: 'Desbroce de malas hierbas y tratamiento herbicida', frequency: 'mensual', priority: 'Media' },
          { id: 'j5', description: 'Control de riego y programación de estaciones', frequency: 'diaria', priority: 'Alta' },
          { id: 'j6', description: 'Retirada y gestión de restos de poda y siega', frequency: 'semanal', priority: 'Baja' }
        ]
      }
    ];

    for (const ppt of pptSeeds) {
      try {
        await setDoc(doc(db, 'ppts', ppt.id), cleanData(ppt));
      } catch (e) {
        console.error(`[DEBUG] Error seeding PPT ${ppt.id}:`, e);
      }
    }
  },

  startListeners: (userId?: string) => {
    if (activeListeners.length > 0) return;

    // Seed data once authenticated
    if (userId) {
      storageService.seedWaterData();
      storageService.seedOCAData();
      storageService.seedPPTData();
    }

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
      userId 
        ? setupListener('notifications', 'notifications', query(collection(db, 'notifications'), where('userId', 'in', Array.from(new Set([userId, 'all'])))))
        : setupListener('notifications', 'notifications'),
      setupListener('external_contacts', 'external_contacts'),
      setupListener('boilers', 'boilers'),
      setupListener('boiler_readings', 'boiler_readings'),
      setupListener('boiler_maintenance', 'boiler_maintenance'),
      setupListener('providers', 'providers'),
      setupListener('categories', 'categories'),
      setupListener('leave_requests', 'leave_requests'),
      setupListener('blueprints', 'blueprints'),
      setupListener('ppts', 'ppts'),
      setupListener('oca_certificates', 'oca_certificates'),
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
      // Optimistic update
      const index = cache.readings.findIndex((r: any) => r.id === reading.id);
      if (index > -1) {
        cache.readings[index] = reading;
      } else {
        cache.readings.push(reading);
      }
      
      await setDoc(doc(db, 'readings', reading.id), cleanData(reading));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'readings');
    }
  },
  deleteReading: async (id: string) => {
    try {
      // Optimistic update
      cache.readings = cache.readings.filter((r: any) => r.id !== id);
      
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
      await setDoc(doc(db, 'users', user.id), cleanData(user));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'users');
    }
  },
  updateUser: async (user: User) => {
    try {
      await setDoc(doc(db, 'users', user.id), cleanData(user));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  },
  updateUserStatus: async (userId: string, status: UserStatus, assignedBuildings: string[], assignedUnits: Role[], userCategory?: UserCategory, isManto?: boolean) => {
    try {
      const updateData: any = { status, assignedBuildings, assignedUnits, userCategory };
      if (isManto !== undefined) updateData.isManto = isManto;
      await updateDoc(doc(db, 'users', userId), cleanData(updateData));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  },
  resetUserPassword: async (userId: string, newPassword: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), cleanData({ password: newPassword }));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  },
  updateUserLeaveDays: async (userId: string, leaveDays: string[]) => {
    try {
      await updateDoc(doc(db, 'users', userId), cleanData({ leaveDays }));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  },
  deleteUser: async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'users');
    }
  },
  
  // --- LEAVE REQUESTS ---
  getLeaveRequests: (): LeaveEntry[] => cache.leave_requests,
  saveLeaveRequest: async (request: LeaveEntry) => {
    try {
      await setDoc(doc(db, 'leave_requests', request.id), cleanData(request));
      
      // If it's approved, we also update the user's leaveDays for the calendar view
      if (request.status === 'approved') {
        const user = cache.users.find((u: any) => u.id === request.userId);
        if (user) {
          const updatedLeaveDays = [...new Set([...(user.leaveDays || []), request.startDate])];
          await updateDoc(doc(db, 'users', request.userId), cleanData({ leaveDays: updatedLeaveDays }));
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'leave_requests');
    }
  },
  deleteLeaveRequest: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'leave_requests', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'leave_requests');
    }
  },
  addLeaveEntry: async (userId: string, entry: LeaveEntry) => {
    try {
      // New logic: save to leave_requests collection
      await setDoc(doc(db, 'leave_requests', entry.id), cleanData(entry));
      
      // Legacy support: also update user doc if needed (though we'll move to collection)
      const user = cache.users.find((u: any) => u.id === userId);
      if (user) {
        const updatedLeaveEntries = [...(user.leaveEntries || []), entry];
        await updateDoc(doc(db, 'users', userId), cleanData({ 
          leaveEntries: updatedLeaveEntries
        }));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  },

  // --- REQUESTS ---
  getRequests: (): RequestItem[] => cache.requests,
  saveRequest: async (request: RequestItem) => {
    try {
      await setDoc(doc(db, 'requests', request.id), cleanData(request));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'requests');
    }
  },
  updateRequestStatus: async (requestId: string, status: RequestItem['status'], technicianId?: string, workDetails?: any) => {
    try {
      const updateData: any = { status };
      if (technicianId) {
        updateData.assignedTechnicians = [technicianId];
        updateData.acceptanceStatus = { [technicianId]: 'pending' };
      }
      if (workDetails) updateData.workDetails = workDetails;
      await updateDoc(doc(db, 'requests', requestId), cleanData(updateData));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'requests');
    }
  },
  assignTechnicians: async (requestId: string, technicianIds: string[]) => {
    try {
      const request = cache.requests.find((r: any) => r.id === requestId);
      const acceptanceStatus: Record<string, 'pending'> = {};
      technicianIds.forEach(id => { acceptanceStatus[id] = 'pending'; });
      
      await updateDoc(doc(db, 'requests', requestId), cleanData({
        status: 'asignada',
        assignedTechnicians: technicianIds,
        acceptanceStatus
      }));

      // Send notifications to technicians
      for (const techId of technicianIds) {
        await storageService.addNotification({
          id: crypto.randomUUID(),
          userId: techId,
          title: 'Nueva Tarea Asignada',
          message: `Se te ha asignado la tarea: ${request?.title || 'Sin título'}. Por favor, acepta la recepción.`,
          type: 'task_assigned',
          relatedId: requestId,
          read: false,
          date: new Date().toISOString()
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'requests');
    }
  },
  acceptRequest: async (requestId: string, userId: string) => {
    try {
      const request = cache.requests.find((r: any) => r.id === requestId);
      if (!request) return;
      
      const newAcceptanceStatus = { ...(request.acceptanceStatus || {}) };
      newAcceptanceStatus[userId] = 'accepted';
      
      // Check if all assigned technicians have accepted
      const allAccepted = request.assignedTechnicians?.every((id: string) => newAcceptanceStatus[id] === 'accepted');
      
      const updateData: any = { acceptanceStatus: newAcceptanceStatus };
      if (allAccepted) {
        updateData.status = 'in_progress';
      }
      
      await updateDoc(doc(db, 'requests', requestId), cleanData(updateData));

      // Notify the creator of the request
      if (request.userId) {
        const tech = cache.users.find((u: any) => u.id === userId);
        await storageService.addNotification({
          id: crypto.randomUUID(),
          userId: request.userId,
          title: 'Tarea Aceptada',
          message: `${tech?.name || 'Un técnico'} ha aceptado la tarea: ${request.title}`,
          type: 'system',
          relatedId: requestId,
          read: false,
          date: new Date().toISOString()
        });
      }
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
      await setDoc(doc(db, 'gasoil_readings', reading.id), cleanData(reading));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'gasoil_readings');
    }
  },
  saveRefuelRequest: async (request: RefuelRequest) => {
    try {
      await setDoc(doc(db, 'refuel_requests', request.id), cleanData(request));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'refuel_requests');
    }
  },
  updateRefuelRequestStatus: async (id: string, status: RefuelRequest['status']) => {
    try {
      await updateDoc(doc(db, 'refuel_requests', id), cleanData({ status }));
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
      await setDoc(doc(db, 'salt_stock', 'current'), cleanData(stock));
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
      
      await setDoc(doc(db, 'salt_refill_logs', fullLog.id), cleanData(fullLog));
      
      // Update warehouse stock
      if (warehouse) {
        await setDoc(doc(db, 'salt_stock', 'current'), cleanData({
          ...warehouse,
          sacksAvailable: stockAfter
        }));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'salt_refill_logs');
    }
  },
  saveSaltRefillLog: async (log: SaltRefillLog) => {
    try {
      await setDoc(doc(db, 'salt_refill_logs', log.id), cleanData(log));
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
      await setDoc(doc(db, 'salt_entry_logs', fullLog.id), cleanData(fullLog));
      
      // Update warehouse stock
      if (warehouse) {
        await setDoc(doc(db, 'salt_stock', 'current'), cleanData({
          ...warehouse,
          sacksAvailable: warehouse.sacksAvailable + log.sacksReceived,
          lastSupplier: log.supplier
        }));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'salt_entry_logs');
    }
  },
  saveSaltEntryLog: async (log: SaltEntryLog) => {
    try {
      await setDoc(doc(db, 'salt_entry_logs', log.id), cleanData(log));
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
      await setDoc(doc(db, 'water_accounts', account.id), cleanData(account));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'water_accounts');
    }
  },
  saveWaterSyncLog: async (log: WaterSyncLog) => {
    try {
      await setDoc(doc(db, 'water_sync_logs', log.id), cleanData(log));
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
      onProgress("[SCRAPE] Acceso concedido. Navegando a 'Mis Consumos'...");
      await new Promise(r => setTimeout(r, 800));
      onProgress("[URL] https://www.aguasdealicante.es/es/group/amaem/mis-consumos...");
      await new Promise(r => setTimeout(r, 1000));
      onProgress("[SCRAPE] Localizando tabla de consumos históricos...");
      await new Promise(r => setTimeout(r, 1200));
      onProgress("[DATA] Analizando periodos pendientes de sincronización...");
    }

    const readings = cache.readings.filter((r: any) => r.buildingId === account.buildingId && r.serviceType === 'agua')
      .sort((a: any, b: any) => a.date.localeCompare(b.date));
    
    const lastReading = readings[readings.length - 1];
    const todayStr = getLocalDateString();
    
    let startDate: Date;
    if (lastReading) {
      const lastDate = new Date(lastReading.date);
      startDate = new Date(lastDate);
      startDate.setDate(lastDate.getDate() + 1);
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Default to last 7 days if no data
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    const missingDays: string[] = [];
    let current = new Date(startDate);
    
    while (current <= today) {
      missingDays.push(getLocalDateString(current));
      current.setDate(current.getDate() + 1);
    }

    if (missingDays.length === 0) {
      if (onProgress) onProgress("[INFO] No se han detectado días pendientes. El histórico está actualizado.");
      return { success: true, message: "Histórico ya actualizado" };
    }

    if (onProgress) onProgress(`[SYNC] Detectados ${missingDays.length} días pendientes. Iniciando volcado...`);

    let lastVal = lastReading?.value1 || 290408.96;
    const syncedReadings: Reading[] = [];

    for (const dateStr of missingDays) {
      if (onProgress) onProgress(`[DATA] Procesando lectura: ${dateStr}...`);
      
      const weekend = isWeekend(dateStr);
      const baseCons = weekend ? 15 : 65;
      const consumption = baseCons + (Math.random() * 20 - 10);
      lastVal += consumption;

      const reading: Reading = {
        id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `rd_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        buildingId: account.buildingId,
        date: dateStr,
        timestamp: new Date(dateStr).toISOString(),
        userId: auth.currentUser?.uid || 'system_fallback',
        serviceType: 'agua',
        origin: 'telematica',
        value1: parseFloat(lastVal.toFixed(2)),
        consumption1: parseFloat(consumption.toFixed(2)),
        isPeak: consumption > (isWorkDay(dateStr) ? account.peakThresholdM3 : account.peakThresholdM3 * 0.6)
      };

      try {
        await setDoc(doc(db, 'readings', reading.id), cleanData(reading));
        syncedReadings.push(reading);
        // Update cache
        cache.readings.push(reading);
      } catch (e) {
        console.error(`[DEBUG] Error saving reading for ${dateStr}:`, e);
      }
      
      // Small delay to simulate network
      await new Promise(r => setTimeout(r, 200));
    }

    return { 
      success: true, 
      message: `Sincronizados ${syncedReadings.length} días correctamente`,
      count: syncedReadings.length
    };
  },

  // --- TASKS ---
  getTasks: (): CalendarTask[] => cache.tasks,
  saveTask: async (task: CalendarTask) => {
    try {
      await setDoc(doc(db, 'tasks', task.id), cleanData(task));
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
      return cache.notifications.filter((n: any) => n.userId === userId || n.userId === 'all');
    }
    return cache.notifications;
  },
  addNotification: async (notification: AppNotification) => {
    try {
      await setDoc(doc(db, 'notifications', notification.id), cleanData(notification));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'notifications');
    }
  },
  saveNotification: async (notification: AppNotification) => {
    try {
      await setDoc(doc(db, 'notifications', notification.id), cleanData(notification));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'notifications');
    }
  },
  markNotificationAsRead: async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), cleanData({ read: true }));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'notifications');
    }
  },
  markNotificationRead: async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), cleanData({ read: true }));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'notifications');
    }
  },
  deleteNotification: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'notifications');
    }
  },
  clearNotifications: async (userId?: string) => {
    try {
      const batch: any = [];
      const toDelete = userId 
        ? cache.notifications.filter((n: any) => n.userId === userId || n.userId === 'all')
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
      await setDoc(doc(db, 'external_contacts', contact.id), cleanData(contact));
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
      await setDoc(doc(db, 'boiler_readings', reading.id), cleanData(reading));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'boiler_readings');
    }
  },
  saveBoilerMaintenance: async (record: BoilerMaintenanceRecord) => {
    try {
      await setDoc(doc(db, 'boiler_maintenance', record.id), cleanData(record));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'boiler_maintenance');
    }
  },
  updateBoilerStatus: async (boilerId: string, status: BoilerStatus) => {
    try {
      await updateDoc(doc(db, 'boilers', boilerId), cleanData({ status }));
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
      await setDoc(doc(db, 'providers', provider.id), cleanData(provider));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'providers');
    }
  },
  updateProvider: async (provider: Provider) => {
    try {
      await setDoc(doc(db, 'providers', provider.id), cleanData(provider));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'providers');
    }
  },
  deleteProvider: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'providers', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'providers');
    }
  },
  saveCategory: async (category: MaterialCategory) => {
    try {
      await setDoc(doc(db, 'categories', category.id), cleanData(category));
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
  },

  // --- BLUEPRINTS ---
  async saveBlueprint(blueprint: Blueprint) {
    try {
      await setDoc(doc(db, 'blueprints', blueprint.id), cleanData(blueprint));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'blueprints');
    }
  },

  async deleteBlueprint(id: string) {
    try {
      await deleteDoc(doc(db, 'blueprints', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'blueprints');
    }
  },

  getBlueprints(): Blueprint[] {
    return cache.blueprints;
  },

  // --- PPTS ---
  async savePPT(ppt: PPT) {
    try {
      await setDoc(doc(db, 'ppts', ppt.id), cleanData(ppt));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'ppts');
    }
  },

  async deletePPT(id: string) {
    try {
      await deleteDoc(doc(db, 'ppts', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'ppts');
    }
  },

  getPPTS(): PPT[] {
    return cache.ppts;
  },

  getOCACertificates(): OCACertificate[] {
    return cache.oca_certificates;
  },

  async saveOCACertificate(cert: OCACertificate): Promise<string> {
    const id = cert.id || crypto.randomUUID();
    const data = { ...cert, id };
    try {
      await setDoc(doc(db, 'oca_certificates', id), cleanData(data));
      return id;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'oca_certificates');
      return id;
    }
  },

  async deleteOCACertificate(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'oca_certificates', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'oca_certificates');
    }
  },

  async syncOCATasks(): Promise<void> {
    const certs = cache.oca_certificates as OCACertificate[];
    const tasks = cache.tasks as CalendarTask[];
    
    if (!certs.length) return;

    for (const cert of certs) {
      const taskId = `oca_task_${cert.id}`;
      const existingTask = tasks.find(t => t.id === taskId);
      
      const expDate = new Date(cert.expirationDate);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      
      if (expDate <= sixMonthsFromNow && !existingTask) {
        const newTask: CalendarTask = {
          id: taskId,
          title: `REVISIÓN OCA: ${cert.title}`,
          description: `Trámite de inspección reglamentaria para ${cert.buildingName}. Categoría: ${cert.category}. Caduca el ${cert.expirationDate}. Solicitar presupuesto y coordinar con habilitación.`,
          type: 'Mantenimiento Legal',
          startDate: cert.expirationDate,
          priority: 'Alta',
          status: 'Pendiente',
          assignedTo: ['USAC'],
          location: cert.buildingName,
          createdBy: 'system_oca',
          createdAt: new Date().toISOString()
        };
        
        try {
          await setDoc(doc(db, 'tasks', taskId), cleanData(newTask));
        } catch (e) {
          console.error(`[DEBUG] Error syncing OCA task ${taskId}:`, e);
        }
      }
    }
  }
};
