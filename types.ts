
export type Role = 'USAC' | 'CG' | 'GCG' | 'GOE3' | 'GOE4' | 'BOEL' | 'UMOE' | 'CECOM' | 'MASTER';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type ServiceType = 'luz' | 'agua' | 'caldera' | 'peticion' | 'material' | 'gasoil' | 'sal' | 'temperatura' | 'mantenimiento';
export type ReadingOrigin = 'manual' | 'telematica' | 'ai';
export type RequestCategory = 'Eléctrico' | 'Fontanería' | 'Calderas / Climatización' | 'Carpintería / Cerraduras' | 'Mobiliario' | 'Informática' | 'Otros' | 'Logística / Almacén' | 'Combustible';
export type UrgencyLevel = 'Baja' | 'Media' | 'Alta' | 'Crítica' | 'Rutina';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: Role;
  status: UserStatus;
  assignedBuildings: string[];
  assignedUnits: Role[];
  phone?: string;
  specialty?: string;
  avatar?: string;
  workload?: number;
  isManto?: boolean;
  leaveDays?: string[]; // ISO dates YYYY-MM-DD
  leaveEntries?: LeaveEntry[];
}

export type LeaveType = 
  | 'Vacaciones'
  | 'Asuntos Propios'
  | 'Descanso Obligatorio'
  | 'Descanso Adicional'
  | 'Maniobras'
  | 'Baja Médica'
  | 'Enfermo Domicilio'
  | 'Permisos Varios (Hospitalización/enfermedad familiar 1º o 2º grado, Otros permisos)'
  | 'Conciliación Familiar'
  | 'Comisión de Servicio'
  | 'Ejercicios Varios'
  | 'Servicio de Guardia'
  | 'Jornada de Instrucción Prolongada'
  | 'Jornada de Instrucción Continuada'
  | 'Curso'
  | 'Flexibilidad Horaria'
  | 'Reducción de Jornada'
  | 'Otro';

export interface LeaveEntry {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  notes?: string;
  createdAt: string;
}

// --- WATER TELEMETRY TYPES (AGUAS DE ALICANTE) ---
export type WaterSyncStatus = 'conectada' | 'error_credenciales' | 'error_web' | 'pendiente';

export interface WaterAccount {
  id: string;
  buildingId: string;
  buildingCode: string;
  buildingName: string;
  contractNumber: string;
  webUser: string;
  password?: string; // Encriptada en el sistema real
  lastSync?: string;
  syncActive: boolean;
  status: WaterSyncStatus;
  peakThresholdPercent: number; // Umbral de pico %
  peakThresholdM3: number;      // Umbral absoluto m3
  syncFrequency: 'diaria' | 'cada_12h' | 'semanal';
  // Selectores para el motor de scraping (según script de análisis)
  selectors?: {
    userField: string;
    passField: string;
    submitBtn: string;
    tableSelector: string;
  };
}

export interface WaterSyncLog {
  id: string;
  accountId: string;
  date: string;
  status: 'exito' | 'error_login' | 'error_scraping' | 'sin_datos';
  readingsObtained: number;
  executionTimeMs: number;
  errorDetail?: string;
  debugSteps?: string[]; // Pasos detallados del análisis
}

// --- GASOIL TYPES ---
export type GasoilAlertStatus = 'normal' | 'atencion' | 'bajo' | 'critico';
export interface GasoilTank {
  id: string;
  buildingId: string;
  buildingCode: string;
  buildingName: string;
  tankNumber: number;
  fullName: string;
  totalCapacity: number;
  currentLevel: number; 
  currentLitres: number;
  lastReading?: string;
  alertStatus: GasoilAlertStatus;
  daysRemaining?: number;
}

export interface GasoilReading {
  id: string;
  tankId: string;
  date: string;
  percentage: number;
  litres: number;
  method: 'visual' | 'varilla' | 'sensor' | 'estimado';
  userId: string;
  notes?: string;
}

export interface RefuelRequest {
  id: string;
  date: string;
  userId: string;
  type: 'manual' | 'emergencia';
  priority: UrgencyLevel;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  totalLitres: number;
  estimatedCost: number;
  tankIds: string[];
  notes?: string;
}

// --- SALT TYPES ---
export type SaltStockStatus = 'normal' | 'bajo' | 'critico';
export interface SaltWarehouse {
  sacksAvailable: number;
  kgPerSack: number;
  minAlertLevel: number;
  criticalAlertLevel: number;
  status: SaltStockStatus;
  lastSupplier?: string;
}
export interface SaltSoftener {
  id: string;
  buildingId: string;
  buildingCode: string;
  buildingName: string;
  lastRefillDate?: string;
  lastRefillSacks?: number;
}

export interface SaltRefillLog {
  id: string;
  softenerId: string;
  buildingName: string;
  date: string;
  sacksUsed: number;
  userId: string;
  userName: string;
  notes?: string;
  stockBefore: number;
  stockAfter: number;
}

export interface SaltEntryLog {
  id: string;
  date: string;
  sacksReceived: number;
  supplier: string;
  userId: string;
  deliveryNote?: string;
}

// --- CALENDAR & TASKS ---
export interface CalendarTask {
  id: string;
  title: string;
  description: string;
  type: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  priority: UrgencyLevel;
  status: 'Pendiente' | 'En Progreso' | 'Completada' | 'Cancelada' | 'Pospuesta';
  assignedTo: string[];
  externalAssignments?: ExternalUser[];
  location?: string;
  recurrence?: 'No' | 'Diaria' | 'Semanal' | 'Mensual';
  reminder?: string[];
  checklist?: ChecklistItem[];
  createdBy: string;
  createdAt: string;
}

export type ExternalCategory = 'Contratista' | 'Proveedor' | 'Otro Departamento' | 'Empresa Externa' | 'Técnico Externo' | 'Personal Temporal';

export interface ExternalUser {
  id: string;
  name: string;
  category: ExternalCategory;
  phone: string;
  company?: string;
  specialty?: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

// --- NOTIFICATIONS ---
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'system' | 'task_assigned' | 'task_overdue' | 'task_completed';
  read: boolean;
  date: string;
  relatedId?: string;
}

// --- BOILER SYSTEM ---
export type BoilerStatus = 'operativa' | 'en_mantenimiento' | 'averiada' | 'fuera_servicio';

export interface Boiler {
  id: string;
  buildingId: string;
  buildingCode: string;
  buildingName: string;
  code: string;
  brand: string;
  model?: string;
  powerKw: number;
  status: BoilerStatus;
  refTemps: {
    impulsionMin: number;
    impulsionMax: number;
    pressureMin: number;
    pressureMax: number;
  };
}

export interface BoilerTemperatureReading {
  id: string;
  boilerId: string;
  date: string;
  tempImpulsion: number;
  tempRetorno: number;
  pressure: number;
  isOn: boolean;
  userId: string;
  userName: string;
  alerts: string[];
  notes?: string;
}

export interface BoilerMaintenanceRecord {
  id: string;
  boilerId: string;
  date: string;
  type: 'preventivo' | 'correctivo' | 'averia' | 'revision' | 'limpieza' | 'sustitucion';
  title: string;
  description: string;
  partsReplaced: { name: string, quantity: number, cost: number }[];
  laborCost: number;
  totalCost: number;
  performedBy: string;
  isExternal: boolean;
  externalCompany?: string;
  statusAfter: BoilerStatus;
  userId: string;
  userName: string;
  requiresFollowUp: boolean;
}

export interface BoilerPart {
  id: string;
  name: string;
  category: string;
  price: number;
}

// --- CORE APP ---
export enum AppTab {
  HOME = 'home',
  DASHBOARD = 'dashboard',
  SCAN = 'scan',
  HISTORY = 'history',
  ADMIN = 'admin',
  SETTINGS = 'settings',
  AI_REQUEST = 'ai_request',
  AI_MATERIAL = 'ai_material',
  USAC_MANAGER = 'usac_manager',
  CALENDAR = 'calendar',
  TEAM = 'team',
  GASOIL = 'gasoil',
  BOILERS = 'boilers',
  SALT = 'salt',
  TEMPERATURES = 'temperatures',
  MAINTENANCE = 'maintenance',
  WATER_SYNC = 'water_sync'
}

export interface Reading {
  id: string;
  buildingId: string;
  date: string;
  timestamp: string;
  userId: string;
  imageUrl?: string;
  serviceType: ServiceType;
  origin: ReadingOrigin;
  value1: number;
  value2?: number;
  consumption1?: number;
  consumption2?: number;
  pressure?: number;
  temperature?: number;
  note?: string;
  isPeak?: boolean;
  peakPercentage?: number;
}

export interface RequestItem {
  id: string;
  userId: string;
  unit: Role;
  type: 'peticion' | 'material';
  category?: RequestCategory;
  urgency?: UrgencyLevel;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'returned' | 'closed' | 'resolved_by_ai' | 'borrador' | 'pendiente' | 'aprobada' | 'rechazada' | 'pedida' | 'recibida_parcial' | 'recibida' | 'cancelada';
  date: string;
  resolvedAt?: string;
  imageUrl?: string;
  aiExplanation?: string;
  aiSteps?: string[];
  materialDetails?: {
    item: string;
    quantity: string;
    workType: string;
  };
  isChronic?: boolean;
  structuralSolution?: string;
  workDetails?: {
    workPerformed: string;
    materialsUsed: string;
    timeSpentMinutes: number;
    afterImageUrl?: string;
  };
  // Enhanced Material Request fields
  items?: MaterialItem[];
  providerId?: string;
  providerName?: string;
  priority?: 'baja' | 'normal' | 'alta' | 'urgente';
  buildingId?: string;
  deliveryLocation?: string;
  notes?: string;
  justification?: string;
  totalEstimatedCost?: number;
  neededDate?: string;
  methodSent?: 'email' | 'whatsapp' | 'save';
  registrationNumber?: string;
}

export interface MaterialItem {
  id: string;
  name: string;
  description?: string;
  reference?: string;
  brand?: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice?: number;
  estimatedTotalPrice?: number;
  suggestedProviderId?: string;
  suggestedProviderName?: string;
  isAiSuggested?: boolean;
  notes?: string;
  needsRequest?: boolean;
}

export interface Provider {
  id: string;
  name: string;
  commercialName?: string;
  cif?: string;
  phone?: string;
  email?: string;
  web?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  categories: string[];
  isPreferred: boolean;
  rating: number;
  totalOrders: number;
  hasCustomerAccount: boolean;
  customerAccountNumber?: string;
  paymentMethod?: string;
  generalDiscount: number;
  minOrder?: number;
  deliveryTimeDays: number;
  doesShipping: boolean;
  shippingCost?: number;
  freeShippingFrom?: number;
  workingHours?: string;
  status: 'activo' | 'inactivo';
  notes?: string;
  createdAt: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  order: number;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  unit: Exclude<Role, 'MASTER'>;
  hasBoiler: boolean;
}
