
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ClipboardList, Clock, ShieldAlert, CheckCircle2, 
  XCircle, ChevronRight, User, Filter, AlertTriangle, 
  Search, MessageCircle, Wrench, Package, ArrowRightLeft, 
  MoreVertical, Eye, BarChart3, TrendingDown, MapPin, Loader2,
  CalendarDays, Timer, CheckCircle, Activity, Camera, FileText,
  BrainCircuit, TrendingUp, Sparkles, Box, Users, Zap, 
  Calendar, Layers, ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Cell, PieChart, Pie, LineChart, Line, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { RequestItem, UrgencyLevel, User as UserType, RequestCategory, Role } from '../types';
import { storageService } from '../services/storageService';
import { GoogleGenAI } from "@google/genai";

interface USACManagerPanelProps {
  currentUser: UserType;
}

// Fixed: Added 'Rutina' to satisfy Record<UrgencyLevel, number>
const SLA_HOURS: Record<UrgencyLevel, number> = {
  'Crítica': 2, 
  'Alta': 24,
  'Media': 48,
  'Baja': 72,
  'Rutina': 168
};

// Fixed: Added 'Rutina' to satisfy Record<UrgencyLevel, number>
const URGENCY_SCORE: Record<UrgencyLevel, number> = {
  'Crítica': 40,
  'Alta': 30,
  'Media': 20,
  'Baja': 10,
  'Rutina': 5
};

const USACManagerPanel: React.FC<USACManagerPanelProps> = ({ currentUser }) => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'peticion' | 'material' | 'stats'>('all');
  const [timeRange, setTimeRange] = useState<'month' | 'year'>('month');
  const [aiStructuralLoading, setAiStructuralLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  // Work Report State
  const [showWorkReportForm, setShowWorkReportForm] = useState(false);
  const [workPerformed, setWorkPerformed] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [timeSpent, setTimeSpent] = useState('60');
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const afterImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRequests();
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadRequests = () => {
    const all = storageService.getRequests();
    setRequests(all); // USAC ve TODO, incluyendo resueltas por IA para el dashboard
  };

  const prioritizedRequests = useMemo(() => {
    if (filterType === 'stats') return [];
    return [...requests]
      .filter(r => r.status !== 'resolved_by_ai') // En la lista de tareas no mostramos las resueltas por IA
      .filter(r => filterType === 'all' || r.type === filterType)
      .sort((a, b) => {
        const chronicA = a.isChronic ? 50 : 0;
        const chronicB = b.isChronic ? 50 : 0;
        const scoreA = (URGENCY_SCORE[a.urgency || 'Baja'] || 0) + chronicA + (1000000000000 / new Date(a.date).getTime());
        const scoreB = (URGENCY_SCORE[b.urgency || 'Baja'] || 0) + chronicB + (1000000000000 / new Date(b.date).getTime());
        return scoreB - scoreA;
      });
  }, [requests, filterType]);

  const analytics = useMemo(() => {
    const all = requests;
    const closed = all.filter(r => r.status === 'closed' && r.resolvedAt);
    const resolvedByAi = all.filter(r => r.status === 'resolved_by_ai');
    const officialRequests = all.filter(r => r.status !== 'resolved_by_ai');
    
    // IA Savings
    const aiSavingRate = all.length > 0 ? (resolvedByAi.length / all.length) * 100 : 0;

    // SLA & Time
    let totalResolutionTime = 0;
    let slaCompliance = 0;
    closed.forEach(r => {
      const creation = new Date(r.date).getTime();
      const resolution = new Date(r.resolvedAt!).getTime();
      const diffHours = (resolution - creation) / (1000 * 60 * 60);
      totalResolutionTime += diffHours;
      if (diffHours <= SLA_HOURS[r.urgency || 'Baja']) slaCompliance++;
    });

    // Materials Counting
    const materialCounts: Record<string, number> = {};
    closed.forEach(r => {
      if (r.workDetails?.materialsUsed) {
        const mats = r.workDetails.materialsUsed.split(',').map(m => m.trim().toLowerCase());
        mats.forEach(m => { if(m) materialCounts[m] = (materialCounts[m] || 0) + 1; });
      }
    });
    const topMaterials = Object.entries(materialCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Categories & Units
    const categories: Record<string, number> = {};
    const units: Record<string, number> = {};
    officialRequests.forEach(r => {
      const cat = r.category || 'Otros';
      categories[cat] = (categories[cat] || 0) + 1;
      units[r.unit] = (units[r.unit] || 0) + 1;
    });

    // Time Series (Monthly for current year)
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const currentYear = new Date().getFullYear();
    const monthlyTrend = months.map((m, i) => {
      const monthRequests = all.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === i && d.getFullYear() === currentYear;
      });
      return {
        name: m,
        total: monthRequests.length,
        ia: monthRequests.filter(r => r.status === 'resolved_by_ai').length,
        oficial: monthRequests.filter(r => r.status !== 'resolved_by_ai').length
      };
    });

    return {
      totalPeticiones: all.length,
      aiSavings: resolvedByAi.length,
      aiSavingRate,
      totalOficial: officialRequests.length,
      avgResolutionTime: closed.length > 0 ? (totalResolutionTime / closed.length).toFixed(1) : '0',
      slaPercentage: closed.length > 0 ? ((slaCompliance / closed.length) * 100).toFixed(0) : '100',
      topCategories: Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5),
      conflictiveUnits: Object.entries(units).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topMaterials,
      monthlyTrend,
      totalChronic: officialRequests.filter(r => r.isChronic).length
    };
  }, [requests]);

  const getSLAInfo = (request: RequestItem) => {
    if (request.status === 'closed' && request.resolvedAt) {
      const creation = new Date(request.date).getTime();
      const resolution = new Date(request.resolvedAt).getTime();
      const diffHours = (resolution - creation) / (1000 * 60 * 60);
      const compliant = diffHours <= SLA_HOURS[request.urgency || 'Baja'];
      return { expired: !compliant, text: compliant ? 'SLA Cumplido' : 'SLA Superado', color: compliant ? 'text-green-500' : 'text-red-500' };
    }

    const creationDate = new Date(request.date);
    const slaLimit = new Date(creationDate.getTime() + SLA_HOURS[request.urgency || 'Baja'] * 60 * 60 * 1000);
    const diff = slaLimit.getTime() - now.getTime();
    
    if (diff < 0) {
      return { expired: true, text: `Excedido ${Math.abs(Math.floor(diff / (1000 * 60 * 60)))}h`, color: 'text-red-500 animate-pulse font-black' };
    }
    
    const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
    return { expired: false, text: `Restan ${hoursRemaining}h`, color: hoursRemaining < 5 ? 'text-orange-500 font-bold' : 'text-gray-400' };
  };

  const handleAfterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAfterImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitWorkReport = () => {
    if (!selectedRequest || !workPerformed) return alert("Indique el trabajo realizado.");

    const workDetails = {
      workPerformed,
      materialsUsed,
      timeSpentMinutes: parseInt(timeSpent),
      afterImageUrl: afterImage || undefined
    };

    storageService.updateRequestStatus(selectedRequest.id, 'closed', undefined, workDetails);
    loadRequests();
    setSelectedRequest(null);
    setShowWorkReportForm(false);
    setWorkPerformed('');
    setMaterialsUsed('');
    setAfterImage(null);
  };

  const handleAction = (id: string, newStatus: RequestItem['status']) => {
    if (newStatus === 'closed') {
      setShowWorkReportForm(true);
      return;
    }
    storageService.updateRequestStatus(id, newStatus);
    loadRequests();
    setSelectedRequest(null);
  };

  const getUrgencyColor = (urgency?: UrgencyLevel) => {
    switch (urgency) {
      case 'Crítica': return 'bg-red-500 text-white';
      case 'Alta': return 'bg-orange-500 text-white';
      case 'Media': return 'bg-yellow-400 text-black';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getStructuralSolution = async (request: RequestItem) => {
    setAiStructuralLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiza esta avería recurrente de tipo ${request.category} en la unidad ${request.unit}: "${request.description}".
        Propón una solución estructural definitiva (reforma, cambio de equipo, plan preventivo) para que no vuelva a ocurrir. Sé breve y técnico.`
      });
      const solution = response.text;
      storageService.updateRequestStatus(request.id, request.status, solution);
      loadRequests();
      setSelectedRequest(prev => prev ? { ...prev, structuralSolution: solution } : null);
    } catch (e) {
      console.error(e);
    } finally {
      setAiStructuralLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 leading-none">Dashboard USAC</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Análisis de Operaciones e IA</p>
        </div>
        <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
          <BarChart3 className="w-5 h-5 text-yellow-400" />
        </div>
      </div>

      <div className="flex gap-2 px-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['all', 'peticion', 'material', 'stats'] as const).map(f => (
          <button 
            key={f}
            onClick={() => setFilterType(f)}
            className={`min-w-[80px] px-4 py-3 rounded-xl font-black uppercase text-[8px] tracking-widest transition-all shrink-0 ${filterType === f ? 'bg-gray-900 text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100'}`}
          >
            {f === 'all' ? 'Ver Todo' : f === 'peticion' ? 'Incidencias' : f === 'material' ? 'Materiales' : 'Analytics IA'}
          </button>
        ))}
      </div>

      {filterType === 'stats' ? (
        <div className="space-y-6 px-2 animate-in slide-in-from-bottom-5">
           {/* Selector de periodo */}
           <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button 
                onClick={() => setTimeRange('month')}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${timeRange === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
              >
                Mensual
              </button>
              <button 
                onClick={() => setTimeRange('year')}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${timeRange === 'year' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
              >
                Anual
              </button>
           </div>

           {/* KPIs Principales: Evitadas vs Creadas */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="p-2 bg-yellow-400/10 rounded-lg inline-block mb-3">
                       <BrainCircuit className="w-5 h-5 text-yellow-400" />
                    </div>
                    <p className="text-3xl font-black">{analytics.aiSavings}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Evitadas por IA</p>
                 </div>
                 <Sparkles className="absolute -bottom-2 -right-2 w-16 h-16 text-yellow-400/5 group-hover:scale-110 transition-transform" />
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="p-2 bg-blue-50 rounded-lg inline-block mb-3">
                       <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-black text-gray-900">{analytics.totalOficial}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Partes Creados</p>
                 </div>
              </div>
           </div>

           {/* Métricas de Rendimiento */}
           <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-green-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Eficiencia Operativa</span>
                </div>
                <div className="bg-green-50 px-3 py-1 rounded-full">
                  <span className="text-[9px] font-black text-green-700">TMR: {analytics.avgResolutionTime}h</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Cumplimiento SLA</span>
                    <p className="text-2xl font-black text-gray-900">{analytics.slaPercentage}%</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Ahorro Humano</span>
                    <p className="text-2xl font-black text-green-600">{analytics.aiSavingRate.toFixed(1)}%</p>
                 </div>
              </div>

              <div className="h-40 w-full mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.monthlyTrend}>
                       <defs>
                          <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#9ca3af'}} />
                       <Area type="monotone" dataKey="oficial" stroke="#111827" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                       <Area type="monotone" dataKey="ia" stroke="#fbbf24" strokeWidth={3} strokeDasharray="5 5" fill="none" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Materiales y Unidades */}
           <div className="grid grid-cols-1 gap-6">
              {/* Material Más Usado */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                   <Box className="w-5 h-5 text-amber-500" />
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Top Materiales Consumidos</h3>
                </div>
                <div className="space-y-4">
                   {analytics.topMaterials.length > 0 ? analytics.topMaterials.map(([mat, count]) => (
                     <div key={mat} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                           <span className="text-xs font-black uppercase text-gray-700 capitalize">{mat}</span>
                        </div>
                        <span className="px-3 py-1 bg-gray-50 text-gray-900 text-[10px] font-black rounded-lg">{count} uds</span>
                     </div>
                   )) : <p className="text-[9px] text-gray-300 italic uppercase">Sin registros de cierre aún</p>}
                </div>
              </div>

              {/* Unidades que más solicitan */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                   <Users className="w-5 h-5 text-blue-500" />
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Demanda por Unidad</h3>
                </div>
                <div className="space-y-4">
                   {analytics.conflictiveUnits.map(([unit, count]) => (
                     <div key={unit} className="space-y-2">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-gray-600">{unit}</span>
                           <span className="text-[10px] font-black text-gray-900">{count} partes</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                           <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${(count / analytics.totalOficial) * 100}%` }}
                           ></div>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              {/* Averías Comunes */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                   <Wrench className="w-5 h-5 text-gray-900" />
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tipología de Incidencias</h3>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.topCategories.map(([cat, val]) => ({ name: cat.substring(0,8), full: cat, val }))}>
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '10px' }} />
                      <Bar dataKey="val" fill="#111827" radius={[8, 8, 0, 0]}>
                        {analytics.topCategories.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#111827' : '#e5e7eb'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="space-y-4 px-2">
          {prioritizedRequests.length === 0 ? (
            <div className="py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
              <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sin trabajos pendientes</p>
            </div>
          ) : (
            prioritizedRequests.map(r => {
              const sla = getSLAInfo(r);
              return (
                <div 
                  key={r.id} 
                  onClick={() => setSelectedRequest(r)}
                  className={`bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 hover:border-gray-900 transition-all active:scale-95 group relative overflow-hidden ${r.urgency === 'Crítica' ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
                >
                  {r.isChronic && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 rounded-bl-xl text-[7px] font-black uppercase tracking-widest">
                      Crónico
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.type === 'peticion' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                        {r.type === 'peticion' ? <Wrench className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-black uppercase text-[10px] text-gray-900 leading-none mb-1">{r.unit}</div>
                        <div className="text-[8px] font-bold text-gray-400 uppercase">{new Date(r.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${getUrgencyColor(r.urgency)}`}>
                      {r.urgency}
                    </div>
                  </div>

                  <h3 className="font-black uppercase text-xs text-gray-900 mb-4 truncate pr-6">{r.title}</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${r.status === 'closed' ? 'bg-green-500' : r.status === 'in_progress' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
                      <span className="text-[9px] font-black uppercase text-gray-500">{r.status === 'open' ? 'Abierta' : r.status === 'in_progress' ? 'En Curso' : 'Resuelta'}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${sla.color}`}>
                      <Timer className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase">{sla.text}</span>
                    </div>
                  </div>

                  <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-200 group-hover:text-gray-900 transition-all" />
                </div>
              );
            })
          )}
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-xl p-6 flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
          <div className="w-full max-w-sm bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <header className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedRequest.type === 'peticion' ? 'bg-blue-500' : 'bg-amber-500'}`}>
                    {selectedRequest.type === 'peticion' ? <Wrench className="w-6 h-6 text-white" /> : <Package className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight leading-none">{selectedRequest.unit}</h3>
                    <p className="text-[9px] text-gray-400 font-black uppercase mt-1">{selectedRequest.category}</p>
                  </div>
               </div>
               <button onClick={() => { setSelectedRequest(null); setShowWorkReportForm(false); }} className="p-2 text-white/30 hover:text-white"><XCircle className="w-6 h-6" /></button>
            </header>

            <main className="flex-1 overflow-y-auto p-8 space-y-8">
              {!showWorkReportForm ? (
                <>
                  <div className="bg-gray-50 p-6 rounded-[2rem] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="text-[8px] font-black uppercase text-gray-400 block tracking-widest">Creado el</span>
                        <span className="text-[10px] font-bold text-gray-900">{new Date(selectedRequest.date).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-[8px] font-black uppercase text-gray-400 block tracking-widest">Estado SLA</span>
                       <span className={`text-[10px] font-black uppercase ${getSLAInfo(selectedRequest).color}`}>
                          {getSLAInfo(selectedRequest).text}
                       </span>
                    </div>
                  </div>

                  {selectedRequest.isChronic && (
                    <div className="p-5 bg-red-600 rounded-[2rem] text-white space-y-3">
                       <div className="flex items-center gap-3">
                          <AlertTriangle className="w-6 h-6" />
                          <h4 className="text-[11px] font-black uppercase tracking-widest">Problema Crónico</h4>
                       </div>
                       {selectedRequest.structuralSolution ? (
                         <div className="bg-black/20 p-4 rounded-2xl border border-white/10">
                            <span className="text-[8px] font-black uppercase text-yellow-400">Solución Estructural:</span>
                            <p className="text-[10px] font-bold mt-1">{selectedRequest.structuralSolution}</p>
                         </div>
                       ) : (
                         <button 
                          onClick={() => getStructuralSolution(selectedRequest)}
                          disabled={aiStructuralLoading}
                          className="w-full mt-2 p-4 bg-white text-red-600 rounded-xl font-black uppercase text-[8px] tracking-widest flex items-center justify-center gap-2"
                         >
                            {aiStructuralLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                            Analizar Solución Permanente
                         </button>
                       )}
                    </div>
                  )}

                  {selectedRequest.imageUrl && (
                    <div className="space-y-2">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Foto Antes:</span>
                       <div className="rounded-[2rem] overflow-hidden border border-gray-100 shadow-lg aspect-video bg-gray-50">
                          <img src={selectedRequest.imageUrl} className="w-full h-full object-cover" />
                       </div>
                    </div>
                  )}

                  {selectedRequest.workDetails?.afterImageUrl && (
                    <div className="space-y-2">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Foto Después:</span>
                       <div className="rounded-[2rem] overflow-hidden border border-gray-100 shadow-lg aspect-video bg-gray-50">
                          <img src={selectedRequest.workDetails.afterImageUrl} className="w-full h-full object-cover" />
                       </div>
                    </div>
                  )}

                  <div className="space-y-3">
                     <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Descripción:</span>
                     <p className="text-sm font-medium text-gray-700 leading-relaxed">{selectedRequest.description}</p>
                  </div>

                  {selectedRequest.status === 'closed' && selectedRequest.workDetails && (
                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] space-y-4">
                      <div className="flex items-center gap-3 text-blue-800">
                        <FileText className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Parte de Trabajo</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <span className="text-[8px] font-black text-blue-400 uppercase">Tiempo</span>
                            <p className="text-xs font-bold text-blue-900">{selectedRequest.workDetails.timeSpentMinutes} min</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[8px] font-black text-blue-400 uppercase">Materiales</span>
                            <p className="text-xs font-bold text-blue-900">{selectedRequest.workDetails.materialsUsed || 'N/A'}</p>
                         </div>
                      </div>
                      <div className="space-y-1">
                         <span className="text-[8px] font-black text-blue-400 uppercase">Trabajo Realizado</span>
                         <p className="text-xs font-medium text-blue-900 italic leading-relaxed">"{selectedRequest.workDetails.workPerformed}"</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-10">
                   <div className="text-center mb-6">
                      <h4 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Parte de Trabajo</h4>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Nº Petición: {selectedRequest.id.split('-')[0]}</p>
                   </div>

                   <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Trabajo Realizado</label>
                        <textarea 
                          value={workPerformed}
                          onChange={(e) => setWorkPerformed(e.target.value)}
                          placeholder="Describa la acción técnica efectuada..."
                          className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl text-xs font-medium outline-none h-24"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Material Utilizado</label>
                        <input 
                          type="text"
                          value={materialsUsed}
                          onChange={(e) => setMaterialsUsed(e.target.value)}
                          placeholder="Ej: Bombilla 20W, Cable 2m..."
                          className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs font-medium outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tiempo (min)</label>
                           <input 
                              type="number"
                              value={timeSpent}
                              onChange={(e) => setTimeSpent(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs font-black outline-none"
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Foto Después</label>
                           <button 
                             onClick={() => afterImageInputRef.current?.click()}
                             className={`w-full p-4 rounded-2xl flex items-center justify-center gap-2 border-2 border-dashed transition-all ${afterImage ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                           >
                              {afterImage ? <CheckCircle className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                              <span className="text-[9px] font-black uppercase">{afterImage ? 'Cargada' : 'Capturar'}</span>
                           </button>
                           <input type="file" ref={afterImageInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleAfterImageChange} />
                         </div>
                      </div>

                      {afterImage && (
                        <div className="relative rounded-2xl overflow-hidden border-2 border-green-100 shadow-md">
                           <img src={afterImage} className="w-full h-32 object-cover" />
                           <button onClick={() => setAfterImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><XCircle className="w-4 h-4" /></button>
                        </div>
                      )}
                   </div>

                   <div className="pt-6 space-y-3">
                      <button 
                        onClick={submitWorkReport}
                        className="w-full p-6 bg-green-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-5 h-5" /> Firmar y Cerrar SLA
                      </button>
                      <button onClick={() => setShowWorkReportForm(false)} className="w-full p-2 text-gray-400 font-black uppercase text-[9px]">Cancelar Cierre</button>
                   </div>
                </div>
              )}
            </main>

            <footer className="p-8 bg-gray-50 border-t border-gray-100 shrink-0 grid grid-cols-2 gap-4">
              {!showWorkReportForm && selectedRequest.status !== 'closed' ? (
                <>
                  {selectedRequest.status === 'open' && (
                    <button 
                      onClick={() => handleAction(selectedRequest.id, 'in_progress')}
                      className="col-span-2 p-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-400" /> Iniciar Intervención
                    </button>
                  )}
                  {selectedRequest.status === 'in_progress' && (
                    <button 
                      onClick={() => handleAction(selectedRequest.id, 'closed')}
                      className="col-span-2 p-6 bg-green-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Finalizar y Cerrar SLA
                    </button>
                  )}
                  <button 
                    onClick={() => handleAction(selectedRequest.id, 'returned')}
                    className="p-5 bg-white border border-gray-200 text-gray-500 rounded-[2rem] font-black uppercase text-[8px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <ArrowRightLeft className="w-4 h-4" /> Devolver
                  </button>
                  <button className="p-5 bg-white border border-gray-200 text-gray-500 rounded-[2rem] font-black uppercase text-[8px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <MoreVertical className="w-4 h-4" /> Reasignar
                  </button>
                </>
              ) : selectedRequest.status === 'closed' && (
                <div className="col-span-2 p-4 bg-green-100 text-green-700 rounded-2xl text-center font-black uppercase text-[10px]">
                  Tarea completada y parte registrado
                </div>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default USACManagerPanel;
