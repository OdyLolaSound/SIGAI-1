
import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Download, CheckCircle2, Globe, FileSpreadsheet, LayoutGrid } from 'lucide-react';
import { Reading, ServiceType, Building, Role, AppTab } from '../types';
import { storageService } from '../services/storageService';

interface HistoryProps {
  serviceType: ServiceType;
  building: Building;
  role: Role;
  onNavigate: (tab: AppTab) => void;
}

const History: React.FC<HistoryProps> = ({ serviceType, building, role, onNavigate }) => {
  const [readings, setReadings] = useState<Reading[]>([]);

  useEffect(() => {
    setReadings(storageService.getReadings(building.id, serviceType).reverse());
  }, [building.id, serviceType]);

  const handleExport = () => {
    const isLuz = serviceType === 'luz';
    const header = `SIGAI-USAC - REPORTE OFICIAL ${serviceType.toUpperCase()}\nEDIFICIO: ${building.name} (${building.code})\nUNIDAD: ${building.unit}\n\nFecha;Valor Principal;Consumo${isLuz ? ';Valor Secundario;Consumo B' : ''};Origen\n`;
    const body = readings.map(r => {
      const date = new Date(r.date).toLocaleDateString('es-ES');
      const v1 = r.value1.toString().replace('.', ',');
      const c1 = (r.consumption1 || 0).toString().replace('.', ',');
      if (isLuz) {
        const v2 = (r.value2 || 0).toString().replace('.', ',');
        const c2 = (r.consumption2 || 0).toString().replace('.', ',');
        return `${date};${v1};${c1};${v2};${c2};${r.origin}`;
      }
      return `${date};${v1};${c1};${r.origin}`;
    }).join("\n");
    
    const blob = new Blob(["\ufeff" + header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `REPORTE_SIGAI_${building.code}_${serviceType}_${new Date().getTime()}.csv`;
    link.click();
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar registro oficial?")) {
      storageService.deleteReading(id);
      setReadings(storageService.getReadings(building.id, serviceType).reverse());
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Registros</h2>
        <button onClick={handleExport} className="p-3 bg-gray-900 text-yellow-400 rounded-xl shadow-lg active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3">
           <FileSpreadsheet className="w-4 h-4" /> CSV
        </button>
      </div>

      <div className="space-y-4">
        {readings.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center gap-4">
            <Calendar className="w-12 h-12 text-gray-200" />
            <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Sin registros</p>
          </div>
        ) : (
          readings.map((r) => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm relative overflow-hidden group">
              {r.origin === 'telematica' && <div className="absolute top-0 right-0 p-1.5 bg-blue-500 rounded-bl-xl shadow-inner"><Globe className="w-4 h-4 text-white" /></div>}
              
              <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-3">
                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <button onClick={() => handleDelete(r.id)} className="text-red-200 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className={`grid ${serviceType === 'luz' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-[9px] font-black text-gray-400 uppercase mb-2">Lectura A</div>
                  <div className="text-xl font-black font-mono text-gray-900 leading-none">{r.value1.toLocaleString('es-ES')}</div>
                  <div className="text-[10px] font-black text-green-600 mt-2 flex items-center gap-1">
                     <CheckCircle2 className="w-3 h-3" /> +{r.consumption1?.toLocaleString('es-ES')}
                  </div>
                </div>
                {serviceType === 'luz' && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-[9px] font-black text-gray-400 uppercase mb-2">Lectura B</div>
                    <div className="text-xl font-black font-mono text-gray-900 leading-none">{r.value2?.toLocaleString('es-ES')}</div>
                    <div className="text-[10px] font-black text-blue-600 mt-2 flex items-center gap-1">
                       <CheckCircle2 className="w-3 h-3" /> +{r.consumption2?.toLocaleString('es-ES')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Navegación Contextual */}
      <button 
        onClick={() => onNavigate(AppTab.DASHBOARD)}
        className="w-full flex items-center justify-center gap-3 p-6 bg-gray-900 text-yellow-400 rounded-[2rem] font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-xl mt-4"
      >
        <LayoutGrid className="w-4 h-4" /> Volver al Panel
      </button>
    </div>
  );
};

export default History;
