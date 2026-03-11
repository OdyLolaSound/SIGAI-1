
import React, { useMemo } from 'react';
import { Users, Calendar, CheckCircle, XCircle, ChevronRight, Phone, Mail, Award } from 'lucide-react';
import { User } from '../types';
import { storageService } from '../services/storageService';

interface TeamPanelProps {
  currentUser: User;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ currentUser }) => {
  const allUsers = useMemo(() => storageService.getUsers(), []);
  const today = new Date().toISOString().split('T')[0];

  const mantoTechs = useMemo(() => {
    return allUsers.filter(u => u.isManto && u.status === 'approved');
  }, [allUsers]);

  const isAvailable = (user: User) => {
    return !user.leaveDays || !user.leaveDays.includes(today);
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="px-2">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Equipo USAC Manto</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Disponibilidad en Tiempo Real</p>
      </div>

      <div className="grid grid-cols-1 gap-4 px-2">
        {mantoTechs.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No hay técnicos de mantenimiento registrados.</p>
          </div>
        ) : (
          mantoTechs.map(tech => {
            const available = isAvailable(tech);
            return (
              <div key={tech.id} className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-50 relative overflow-hidden group">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center text-yellow-400 text-xl font-black">
                      {tech.name.charAt(0)}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center ${available ? 'bg-green-500' : 'bg-red-500'}`}>
                      {available ? <CheckCircle className="w-3 h-3 text-white" /> : <XCircle className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-sm uppercase truncate">{tech.name}</h3>
                      {tech.role === 'MASTER' && <Award className="w-3 h-3 text-yellow-500" />}
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-3">{tech.specialty || 'Técnico Polivalente'}</p>
                    
                    <div className="flex gap-2">
                      {tech.phone && (
                        <a href={`tel:${tech.phone}`} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                          <Phone className="w-3 h-3" />
                        </a>
                      )}
                      <a href={`mailto:${tech.username}`} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                        <Mail className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg mb-1 ${available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {available ? 'Disponible' : 'En Permiso'}
                    </div>
                    <div className="text-[7px] text-gray-400 font-bold uppercase">Hoy</div>
                  </div>
                </div>

                {!available && tech.leaveDays && (
                   <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-red-400" />
                      <span className="text-[8px] font-black text-red-400 uppercase">Próxima incorporación: {getNextAvailableDate(tech.leaveDays, today)}</span>
                   </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white mx-2 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h4 className="text-lg font-black uppercase tracking-tight mb-2">Resumen de Fuerza</h4>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white/10 p-4 rounded-2xl">
              <div className="text-2xl font-black text-yellow-400">{mantoTechs.filter(isAvailable).length}</div>
              <div className="text-[8px] font-bold uppercase tracking-widest opacity-60">Operativos</div>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl">
              <div className="text-2xl font-black text-red-400">{mantoTechs.filter(t => !isAvailable(t)).length}</div>
              <div className="text-[8px] font-bold uppercase tracking-widest opacity-60">Baja/Permiso</div>
            </div>
          </div>
        </div>
        <Users className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
      </div>
    </div>
  );
};

function getNextAvailableDate(leaveDays: string[], today: string): string {
  const checkDate = new Date(today);
  // Check up to 60 days in the future
  for (let i = 0; i < 60; i++) {
    checkDate.setDate(checkDate.getDate() + 1);
    const checkStr = checkDate.toISOString().split('T')[0];
    if (!leaveDays.includes(checkStr)) {
      const d = new Date(checkStr);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    }
  }
  return "Próximamente";
}

export default TeamPanel;
