
import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Plus, Trash2, Download, Building, 
  Calendar, Filter, X, CheckCircle2, AlertTriangle, 
  Clock, Briefcase, Sparkles, Loader2, ChevronRight,
  ChevronDown, ListChecks, CalendarPlus
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { PPT, PPTTask, User, UrgencyLevel, CalendarTask } from '../types';
import { getLocalDateString } from '../services/dateUtils';
import { GoogleGenAI } from "@google/genai";

interface PPTModuleProps {
  user: User;
}

const PPTModule: React.FC<PPTModuleProps> = ({ user }) => {
  const [ppts, setPpts] = useState<PPT[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [expandedPpt, setExpandedPpt] = useState<string | null>(null);
  
  const [newPpt, setNewPpt] = useState<Partial<PPT>>({
    title: '',
    category: 'Otros',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    tasks: [],
    status: 'active'
  });

  useEffect(() => {
    setPpts(storageService.getPPTS());
  }, []);

  const handleSave = async () => {
    if (!newPpt.title || !newPpt.category) {
      alert('Título y Categoría son obligatorios');
      return;
    }

    const ppt: PPT = {
      id: crypto.randomUUID(),
      title: newPpt.title,
      category: newPpt.category as any,
      companyName: newPpt.companyName,
      validFrom: newPpt.validFrom || new Date().toISOString(),
      validTo: newPpt.validTo || '',
      tasks: newPpt.tasks || [],
      status: 'active',
      createdAt: new Date().toISOString()
    };

    await storageService.savePPT(ppt);
    setPpts(storageService.getPPTS());
    setShowAddModal(false);
    setNewPpt({ title: '', category: 'Otros', tasks: [], status: 'active' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar este Sectorial?')) {
      await storageService.deletePPT(id);
      setPpts(storageService.getPPTS());
    }
  };

  const simulateAIExtraction = async () => {
    setIsExtracting(true);
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const mockTasks: PPTTask[] = [
      {
        id: crypto.randomUUID(),
        description: 'Revisión mensual de niveles y engrase',
        frequency: 'mensual',
        priority: 'Media'
      },
      {
        id: crypto.randomUUID(),
        description: 'Prueba de paracaídas y limitador de velocidad',
        frequency: 'anual',
        priority: 'Crítica'
      },
      {
        id: crypto.randomUUID(),
        description: 'Inspección técnica reglamentaria (OCA)',
        frequency: 'bienal',
        priority: 'Alta'
      }
    ];

    setNewPpt(prev => ({
      ...prev,
      tasks: mockTasks,
      title: prev.title || 'Sectorial Extraído por IA'
    }));
    setIsExtracting(false);
  };

  const filteredPpts = ppts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleGenerateChecklist = (ppt: PPT) => {
    const newTask: CalendarTask = {
      id: crypto.randomUUID(),
      title: `Checklist: ${ppt.title}`,
      description: `Tareas de cumplimiento según PPT: ${ppt.title}. Empresa: ${ppt.companyName || 'N/A'}`,
      type: 'Inspección',
      startDate: getLocalDateString(new Date()),
      startTime: '08:00',
      priority: 'Media',
      status: 'Pendiente',
      assignedTo: [],
      location: 'Acuartelamiento',
      checklist: ppt.tasks.map(t => ({
        id: crypto.randomUUID(),
        text: `[${t.frequency.toUpperCase()}] ${t.description}`,
        completed: false
      })),
      createdBy: user.id,
      createdAt: new Date().toISOString()
    };

    storageService.saveTask(newTask);
    alert('✅ Checklist generado en la Agenda para el día de hoy.');
  };

  if (user.userCategory !== 'Oficina de Control' && user.role !== 'MASTER') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Acceso Restringido</h2>
        <p className="text-sm text-gray-500 max-w-xs">Solo el personal de la Oficina de Control tiene acceso a los Sectoriales.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Sectoriales</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mantenimientos y Normativa Sectorial</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="p-4 bg-gray-900 text-yellow-400 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Nuevo Sectorial</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por título o empresa..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-xs font-bold outline-none focus:border-gray-900 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-xs font-bold outline-none focus:border-gray-900 transition-all appearance-none"
            >
              <option value="all">Todas las categorías</option>
              <option value="Ascensores">Ascensores</option>
              <option value="Centros de Transformación">Centros de Transformación</option>
              <option value="Legionella">Legionella</option>
              <option value="Térmicas">Térmicas</option>
              <option value="Piscinas">Piscinas</option>
              <option value="Jardinería">Jardinería</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
        </div>
      </div>

      {/* PPTs List */}
      <div className="space-y-4">
        {filteredPpts.length > 0 ? (
          filteredPpts.map(p => (
            <div key={p.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <div 
                className="p-6 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedPpt(expandedPpt === p.id ? null : p.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-900">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">{p.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[8px] font-black bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full uppercase tracking-widest">{p.category}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{p.companyName || 'Empresa no asignada'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Tareas</div>
                    <div className="text-xs font-black text-gray-900">{p.tasks.length}</div>
                  </div>
                  {expandedPpt === p.id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                </div>
              </div>

              {expandedPpt === p.id && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-50 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Vigencia</span>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-700">
                        <Calendar className="w-3 h-3" />
                        {new Date(p.validFrom).toLocaleDateString()} - {p.validTo ? new Date(p.validTo).toLocaleDateString() : 'Indefinido'}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Estado</span>
                        <span className={`text-[10px] font-black uppercase ${p.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                          {p.status === 'active' ? 'Vigente' : 'Expirado'}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                        className="p-2 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleGenerateChecklist(p)}
                    className="w-full mb-6 p-4 bg-yellow-400 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Generar Checklist en Agenda
                  </button>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ListChecks className="w-4 h-4 text-gray-400" />
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tareas de Mantenimiento</span>
                    </div>
                    {p.tasks.map(task => (
                      <div key={task.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            task.priority === 'Crítica' ? 'bg-red-500' : 
                            task.priority === 'Alta' ? 'bg-orange-500' : 'bg-blue-500'
                          }`} />
                          <div>
                            <p className="text-xs font-bold text-gray-800">{task.description}</p>
                            <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{task.frequency}</span>
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-gray-100 group-hover:text-green-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">No hay sectoriales registrados</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <header className="p-8 bg-gray-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">Nuevo Sectorial</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white/30 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 space-y-3">
                <div className="flex items-center gap-2 text-blue-800">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Extracción Inteligente</span>
                </div>
                <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                  Sube el PDF del Sectorial y la IA extraerá automáticamente las tareas de mantenimiento y su frecuencia.
                </p>
                <button 
                  onClick={simulateAIExtraction}
                  disabled={isExtracting}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {isExtracting ? 'Analizando Documento...' : 'Escanear Sectorial (PDF)'}
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Título del Sectorial</label>
                  <input 
                    type="text" 
                    value={newPpt.title}
                    onChange={e => setNewPpt({...newPpt, title: e.target.value})}
                    className="w-full p-5 bg-gray-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 ring-yellow-400 transition-all"
                    placeholder="Ej: Mantenimiento Ascensores 2024"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Categoría</label>
                    <select 
                      value={newPpt.category}
                      onChange={e => setNewPpt({...newPpt, category: e.target.value as any})}
                      className="w-full p-5 bg-gray-50 rounded-2xl font-black uppercase text-[10px] outline-none"
                    >
                      <option value="Ascensores">Ascensores</option>
                      <option value="Centros de Transformación">Centros de Transformación</option>
                      <option value="Legionella">Legionella</option>
                      <option value="Térmicas">Térmicas</option>
                      <option value="Piscinas">Piscinas</option>
                      <option value="Jardinería">Jardinería</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Empresa</label>
                    <input 
                      type="text" 
                      value={newPpt.companyName}
                      onChange={e => setNewPpt({...newPpt, companyName: e.target.value})}
                      className="w-full p-5 bg-gray-50 rounded-2xl font-bold text-xs outline-none"
                      placeholder="Nombre empresa..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Desde</label>
                    <input 
                      type="date" 
                      value={newPpt.validFrom}
                      onChange={e => setNewPpt({...newPpt, validFrom: e.target.value})}
                      className="w-full p-5 bg-gray-50 rounded-2xl font-bold text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Hasta</label>
                    <input 
                      type="date" 
                      value={newPpt.validTo}
                      onChange={e => setNewPpt({...newPpt, validTo: e.target.value})}
                      className="w-full p-5 bg-gray-50 rounded-2xl font-bold text-xs outline-none"
                    />
                  </div>
                </div>

                {newPpt.tasks && newPpt.tasks.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Tareas Extraídas ({newPpt.tasks.length})</label>
                    <div className="space-y-2">
                      {newPpt.tasks.map(t => (
                        <div key={t.id} className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-[10px] font-bold text-green-800">{t.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleSave}
                className="w-full p-6 bg-gray-900 text-yellow-400 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all"
              >
                Guardar Sectorial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PPTModule;
