
import React, { useMemo } from 'react';
import { 
  Calendar, MessageSquare, Package, Zap, Droplets, Flame, 
  Users, ClipboardList, Camera, FileText, BookOpen, Map,
  ChevronRight, ArrowUpRight, ArrowDownRight, AlertCircle,
  TrendingUp, Settings, ShieldAlert, Timer, CheckCircle2,
  Warehouse, FileSpreadsheet, HardHat, Fuel, Globe
} from 'lucide-react';
import { AppTab, User, ServiceType, Building, Role, UrgencyLevel } from '../types';
import { storageService, BUILDINGS } from '../services/storageService';
import { getLocalDateString } from '../services/dateUtils';

interface UnitDashboardProps {
  user: User;
  onNavigate: (tab: AppTab) => void;
  onServiceClick: (service: ServiceType) => void;
  onRequestClick: (type: 'peticion' | 'material') => void;
}

const UnitDashboard: React.FC<UnitDashboardProps> = ({ user, onNavigate, onServiceClick, onRequestClick }) => {
  const isMaster = user.role === 'MASTER';
  
  // DATA CALCULATIONS
  const tasks = useMemo(() => storageService.getTasks(), []);
  const requests = useMemo(() => storageService.getRequests(), []);
  const team = useMemo(() => storageService.getUsers(), []);
  const waterReadings = useMemo(() => storageService.getReadings('BASE_ALICANTE', 'agua'), []);
  
  const pendingTasksCount = tasks.filter(t => t.status !== 'Completada').length;
  const urgentRequests = requests.filter(r => r.urgency === 'Crítica' && r.status !== 'closed').length;
  const mediumRequests = requests.filter(r => (r.urgency === 'Alta' || r.urgency === 'Media') && r.status !== 'closed').length;
  
  const activeTechs = useMemo(() => {
    const today = getLocalDateString();
    return team.filter(u => 
      u.status === 'approved' && 
      u.isManto && 
      (!u.leaveDays || !u.leaveDays.includes(today))
    ).length;
  }, [team]);

  const techniciansOnLeave = useMemo(() => {
    const today = getLocalDateString();
    return team.filter(u => 
      u.status === 'approved' && 
      u.isManto && 
      u.leaveDays?.includes(today)
    ).map(u => {
      const entry = u.leaveEntries?.find(e => today >= e.startDate && today <= e.endDate);
      return { name: u.name, type: entry?.type };
    });
  }, [team]);

  // Real data for water
  const waterLast = waterReadings[waterReadings.length - 1];
  const waterStats = useMemo(() => {
    const today = waterLast?.consumption1 || 0;
    const isPeak = waterLast?.isPeak || false;
    return { val: today, isPeak };
  }, [waterLast]);

  const stats = {
    luz: { val: 2450, trend: '+12%', up: true, unit: 'kWh' },
    agua: { val: waterStats.val, trend: waterStats.isPeak ? 'ALERTA' : 'Normal', up: waterStats.isPeak, unit: 'm³' },
    caldera: { val: 68, trend: 'Ok', up: null, unit: '°C' }
  };

  const progresoGeneral = useMemo(() => {
    const total = requests.length;
    if (total === 0) return 100;
    const closed = requests.filter(r => r.status === 'closed').length;
    return Math.round((closed / total) * 100);
  }, [requests]);

  const isRestricted = !isMaster && user.role !== 'USAC';
  
  return (
    <div className="w-full max-w-sm mx-auto space-y-10 pb-12 animate-in fade-in duration-500">
      
      {/* HEADER UNIDAD */}
      <div className="relative overflow-hidden bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
             <div className="bg-yellow-400 p-3 rounded-2xl">
                <HardHat className="w-6 h-6 text-black" />
             </div>
             <button onClick={() => onNavigate(AppTab.SETTINGS)} className="p-2 bg-white/10 rounded-xl">
                <Settings className="w-5 h-5 text-gray-400" />
             </button>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">
            {isMaster ? 'MÓDULO MAESTRO' : `UNIDAD ${user.role}`}
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">
            {isRestricted ? 'Solicitud de Apoyo Técnico' : 'Sistema Integrado de Apoyo'}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
          <Warehouse className="w-32 h-32" />
        </div>
      </div>

      {/* SECCIÓN: GESTIÓN DE PETICIONES (RESTRICTED OR FULL) */}
      <section className="space-y-4 px-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-yellow-500" /> {isRestricted ? 'Nueva Solicitud' : 'Gestión Operativa'}
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {!isRestricted && (
            <ActionButton 
              icon={<Calendar className="w-6 h-6" />}
              title="Mi Agenda"
              desc="Tareas y mantenimiento"
              badge={pendingTasksCount > 0 ? `${pendingTasksCount} Pendientes` : undefined}
              onClick={() => onNavigate(AppTab.CALENDAR)}
              color="bg-white border-gray-100"
            />
          )}
          
          <div className={`grid ${isRestricted ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
            <ActionButton 
              icon={<MessageSquare className="w-5 h-5" />}
              title="Abrir Parte"
              desc="Incidencias IA"
              onClick={() => onRequestClick('peticion')}
              color="bg-blue-50 border-blue-100 text-blue-900"
              compact={!isRestricted}
            />
            <ActionButton 
              icon={<Package className="w-5 h-5" />}
              title="Materiales"
              desc="Gestión Almacén"
              onClick={() => onRequestClick('material')}
              color="bg-amber-50 border-amber-100 text-amber-900"
              compact={!isRestricted}
            />
          </div>
        </div>
      </section>

      {!isRestricted && (
        <>
          {/* SECCIÓN 2: CONSUMOS Y SUMINISTROS */}
          <section className="space-y-4 px-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" /> Consumos y Suministros
              </h3>
              <button onClick={() => onNavigate(AppTab.HISTORY)} className="text-[9px] font-black text-blue-600 uppercase">Historial</button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              <ConsumptionCard 
                icon={<Zap className="w-5 h-5" />} 
                title="Luz" 
                value={stats.luz.val} 
                unit={stats.luz.unit}
                trend={stats.luz.trend}
                up={stats.luz.up}
                color="bg-yellow-400"
                onClick={() => onServiceClick('luz')}
              />
              <ConsumptionCard 
                icon={<Droplets className="w-5 h-5" />} 
                title="Agua" 
                value={stats.agua.val} 
                unit={stats.agua.unit}
                trend={stats.agua.trend}
                up={stats.agua.up}
                color={stats.agua.up ? "bg-red-500" : "bg-blue-500"}
                onClick={() => onNavigate(AppTab.WATER_SYNC)}
              />
              <ConsumptionCard 
                icon={<Flame className="w-5 h-5" />} 
                title="Calderas" 
                value={19} 
                unit="Tanques"
                trend="Control SIGAI"
                up={null}
                color="bg-orange-600"
                onClick={() => onNavigate(AppTab.BOILERS)}
              />
            </div>
          </section>

          {/* SECCIÓN 3: EQUIPO Y GESTIÓN USAC */}
          <section className="space-y-4 px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" /> Mi Equipo USAC
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                       <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><Users className="w-5 h-5" /></div>
                       <div>
                          <span className="text-[10px] font-black text-gray-900 uppercase">Técnicos Activos</span>
                          <div className="text-2xl font-black">{activeTechs}</div>
                       </div>
                    </div>
                    <button onClick={() => onNavigate(AppTab.TEAM)} className="p-3 bg-gray-900 text-white rounded-xl shadow-lg active:scale-95">
                       <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>

                 {techniciansOnLeave.length > 0 && (
                   <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100">
                     <div className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-2">Bajas / Permisos Hoy</div>
                     <div className="space-y-2">
                       {techniciansOnLeave.map((tech, i) => (
                         <div key={i} className="flex justify-between items-center">
                           <span className="text-[10px] font-black text-gray-900 uppercase">{tech.name}</span>
                           <span className="text-[8px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-lg uppercase">{tech.type || 'Libre'}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                 
                 <div className="grid grid-cols-3 gap-3">
                    <StatusBox label="Urgente" val={urgentRequests} color="text-red-600 bg-red-50" />
                    <StatusBox label="Media" val={mediumRequests} color="text-amber-600 bg-amber-50" />
                    <StatusBox label="Finalizado" val={requests.filter(r => r.status === 'closed').length} color="text-green-600 bg-green-50" />
                 </div>

                 <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-400">
                       <span>SLA Diario</span>
                       <span>{progresoGeneral}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                       <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progresoGeneral}%` }} />
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => onNavigate(AppTab.USAC_MANAGER)}
                className="w-full p-6 bg-gray-900 text-yellow-400 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"
              >
                <ClipboardList className="w-5 h-5" /> Panel Gestión de Prioridades
              </button>
            </div>
          </section>
        </>
      )}

    </div>
  );
};

const ActionButton: React.FC<{ icon: React.ReactNode, title: string, desc: string, badge?: string, onClick: () => void, color: string, compact?: boolean }> = ({ icon, title, desc, badge, onClick, color, compact }) => (
  <button 
    onClick={onClick} 
    className={`${color} border-2 rounded-[2.5rem] shadow-sm text-left flex items-center transition-all active:scale-95 group relative overflow-hidden ${compact ? 'p-3 gap-2' : 'p-6 justify-between'}`}
  >
    <div className={`flex items-center relative z-10 ${compact ? 'gap-2' : 'gap-4'}`}>
      <div className={`rounded-2xl shrink-0 flex items-center justify-center ${compact ? 'w-10 h-10 bg-white/50' : 'p-4 bg-gray-900 text-yellow-400 shadow-xl'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className="font-black text-[11px] uppercase leading-none mb-1 truncate">{title}</h4>
        <p className={`opacity-60 font-bold uppercase tracking-widest truncate ${compact ? 'text-[7px]' : 'text-[9px]'}`}>{desc}</p>
        {badge && <span className="inline-block mt-2 px-2 py-0.5 bg-red-600 text-white text-[7px] font-black rounded-lg uppercase">{badge}</span>}
      </div>
    </div>
    {!compact && <ChevronRight className="w-5 h-5 opacity-20 group-hover:translate-x-1 transition-transform" />}
  </button>
);

const ConsumptionCard: React.FC<{ icon: React.ReactNode, title: string, value: number, unit: string, trend: string, up: boolean | null, color: string, onClick: () => void }> = ({ icon, title, value, unit, trend, up, color, onClick }) => (
  <button onClick={onClick} className="min-w-[140px] bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm active:scale-95 transition-all text-left">
     <div className="flex items-center justify-between mb-4">
        <div className={`${color} p-2 rounded-xl text-white`}>{icon}</div>
        {up !== null && (
          <div className={`flex items-center text-[9px] font-black ${up ? 'text-red-500' : 'text-green-500'}`}>
             {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
             {trend}
          </div>
        )}
     </div>
     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</h4>
     <div className="flex items-baseline gap-1">
        <span className="text-xl font-black text-gray-900">{value}</span>
        <span className="text-[8px] font-bold text-gray-400 uppercase">{unit}</span>
     </div>
  </button>
);

const StatusBox: React.FC<{ label: string, val: number, color: string }> = ({ label, val, color }) => (
  <div className={`${color} p-3 rounded-2xl text-center border border-current opacity-80`}>
     <div className="text-xs font-black mb-0.5">{val}</div>
     <div className="text-[7px] font-black uppercase tracking-tighter">{label}</div>
  </div>
);

export default UnitDashboard;
