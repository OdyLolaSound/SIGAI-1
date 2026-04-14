
import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  Building, 
  FileText,
  Trash2,
  CheckCircle2,
  DollarSign,
  Send,
  Mail
} from 'lucide-react';
import { OCACertificate, Building as BuildingType } from '../types';
import { storageService, BUILDINGS } from '../services/storageService';
import { motion, AnimatePresence } from 'motion/react';

const OCAModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingCert, setEditingCert] = useState<OCACertificate | null>(null);

  const certificates = storageService.getOCACertificates();
  const currentYear = new Date().getFullYear();

  const filteredCerts = useMemo(() => {
    return certificates
      .filter(c => {
        const matchesSearch = 
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.buildingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
  }, [certificates, searchTerm, filterCategory]);

  const expiringThisYear = useMemo(() => {
    return certificates.filter(c => {
      const expYear = new Date(c.expirationDate).getFullYear();
      return expYear === currentYear;
    });
  }, [certificates, currentYear]);

  const getStatusColor = (status: OCACertificate['status']) => {
    switch (status) {
      case 'vigente': return 'bg-green-100 text-green-700 border-green-200';
      case 'expirando': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'caducado': return 'bg-red-100 text-red-700 border-red-200';
      case 'pendiente_presupuesto': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este certificado?')) {
      await storageService.deleteOCACertificate(id);
    }
  };

  const handleNotifyHabilitacion = () => {
    const list = expiringThisYear.map(c => `- ${c.title} (${c.buildingName}): Expira el ${c.expirationDate}`).join('\n');
    const subject = `Certificados OCA - Vencimientos ${currentYear}`;
    const body = `Hola,\n\nEnvío relación de certificados OCA que caducan en el año en curso (${currentYear}) para su conocimiento y gestión de habilitación:\n\n${list}\n\nSaludos.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Certificados</p>
            <p className="text-2xl font-black text-gray-900">{certificates.length}</p>
          </div>
        </div>

        <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Expira este año</p>
              <p className="text-2xl font-black text-amber-900">{expiringThisYear.length}</p>
            </div>
          </div>
          {expiringThisYear.length > 0 && (
            <button 
              onClick={handleNotifyHabilitacion}
              className="p-3 bg-white text-amber-600 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-90"
              title="Notificar a Habilitación por Email"
            >
              <Mail className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-red-800 uppercase tracking-widest">Caducados</p>
            <p className="text-2xl font-black text-red-900">{certificates.filter(c => c.status === 'caducado').length}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar por título, edificio o empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex-1 md:flex-none px-4 py-3 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border-none"
          >
            <option value="all">Todas las Categorías</option>
            <option value="Baja Tensión">Baja Tensión</option>
            <option value="Alta Tensión">Alta Tensión</option>
            <option value="Equipos a Presión">Equipos a Presión</option>
            <option value="Ascensores">Ascensores</option>
            <option value="Incendios">Incendios</option>
            <option value="Legionella">Legionella</option>
          </select>
          <button 
            onClick={() => { setEditingCert(null); setShowForm(true); }}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-black transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredCerts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
            <ShieldCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No se encontraron certificados</p>
          </div>
        ) : (
          filteredCerts.map(cert => (
            <motion.div 
              layout
              key={cert.id}
              className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    cert.status === 'caducado' ? 'bg-red-50 text-red-500' : 
                    cert.status === 'expirando' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                  }`}>
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{cert.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(cert.status)}`}>
                        {cert.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Building className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase">{cert.buildingName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase">Expira: {cert.expirationDate}</span>
                      </div>
                      {cert.companyName && (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase">{cert.companyName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  {cert.status !== 'vigente' && !cert.budgetRequested && (
                    <button 
                      onClick={() => storageService.saveOCACertificate({ ...cert, status: 'pendiente_presupuesto', budgetRequested: true })}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Pedir Presupuesto
                    </button>
                  )}
                  {cert.budgetRequested && !cert.budgetReceived && (
                    <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Presupuesto Pedido
                    </div>
                  )}
                  <button 
                    onClick={() => { setEditingCert(cert); setShowForm(true); }}
                    className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                  <button 
                    onClick={() => handleDelete(cert.id)}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-gray-900 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">
                    {editingCert ? 'Editar Certificado' : 'Nuevo Certificado OCA'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Gestión de Inspecciones Reglamentarias</p>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <form className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const building = BUILDINGS.find(b => b.id === formData.get('buildingId'));
                
                const cert: OCACertificate = {
                  id: editingCert?.id || crypto.randomUUID(),
                  title: formData.get('title') as string,
                  category: formData.get('category') as any,
                  buildingId: formData.get('buildingId') as string,
                  buildingName: building?.name || '',
                  lastInspectionDate: formData.get('lastInspectionDate') as string,
                  expirationDate: formData.get('expirationDate') as string,
                  periodicityYears: Number(formData.get('periodicityYears')),
                  status: formData.get('status') as any,
                  companyName: formData.get('companyName') as string,
                  notes: formData.get('notes') as string,
                  budgetRequested: editingCert?.budgetRequested || false,
                  budgetReceived: editingCert?.budgetReceived || false
                };

                await storageService.saveOCACertificate(cert);
                setShowForm(false);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-2">Título del Certificado</label>
                    <input 
                      name="title"
                      defaultValue={editingCert?.title}
                      required
                      placeholder="Ej: Inspección Eléctrica Baja Tensión"
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-2">Categoría</label>
                    <select 
                      name="category"
                      defaultValue={editingCert?.category || 'Baja Tensión'}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-blue-500/20 transition-all"
                    >
                      <option value="Baja Tensión">Baja Tensión</option>
                      <option value="Alta Tensión">Alta Tensión</option>
                      <option value="Equipos a Presión">Equipos a Presión</option>
                      <option value="Ascensores">Ascensores</option>
                      <option value="Incendios">Incendios</option>
                      <option value="Legionella">Legionella</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-2">Edificio</label>
                    <select 
                      name="buildingId"
                      defaultValue={editingCert?.buildingId}
                      required
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-blue-500/20 transition-all"
                    >
                      {BUILDINGS.map(b => (
                        <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-2">Última Inspección</label>
                    <input 
                      type="date"
                      name="lastInspectionDate"
                      defaultValue={editingCert?.lastInspectionDate}
                      required
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-2">Fecha Caducidad</label>
                    <input 
                      type="date"
                      name="expirationDate"
                      defaultValue={editingCert?.expirationDate}
                      required
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-2">Periodicidad (Años)</label>
                    <input 
                      type="number"
                      name="periodicityYears"
                      defaultValue={editingCert?.periodicityYears || 5}
                      required
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-2">Estado Actual</label>
                    <select 
                      name="status"
                      defaultValue={editingCert?.status || 'vigente'}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-blue-500/20 transition-all"
                    >
                      <option value="vigente">Vigente</option>
                      <option value="expirando">Expirando</option>
                      <option value="caducado">Caducado</option>
                      <option value="pendiente_presupuesto">Pendiente Presupuesto</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-2">Empresa Mantenedora / OCA</label>
                    <input 
                      name="companyName"
                      defaultValue={editingCert?.companyName}
                      placeholder="Ej: SGS, Applus, TÜV SÜD..."
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-2">Notas Adicionales</label>
                    <textarea 
                      name="notes"
                      defaultValue={editingCert?.notes}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-blue-500/20 transition-all h-32 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-5 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-900/20"
                  >
                    {editingCert ? 'Guardar Cambios' : 'Crear Certificado'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OCAModule;
