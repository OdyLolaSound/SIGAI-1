
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X, Trash2, AlertCircle } from 'lucide-react';
import { User, LeaveType, LeaveEntry } from '../types';
import { storageService } from '../services/storageService';
import { getLocalDateString, isHoliday } from '../services/dateUtils';

interface LaborCalendarProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

const LEAVE_TYPES: LeaveType[] = [
  'VA - VACACIONES',
  'AP - ASUNTOS PROPIOS',
  'DO - DESCANSO OBLIGATORIO',
  'DA - DESCANSO ADICIONAL',
  'MA - MANIOBRAS',
  'BM - BAJA MÉDICA',
  'AZ - ENFERMO DOMICILIO',
  'PV - PERMISOS VARIOS',
  'VA - VACACIONES (AÑO ANTERIOR)',
  'AP - ASUNTOS PROPIOS (AÑO ANTERIOR)',
  'CON - CONCILIACIÓN FAMILIAR',
  'CS - COMISIÓN DE SERVICIO',
  'CS - EJERCICIOS VARIOS',
  'SG - SERVICIO DE GUARDIA',
  'JIP - JORNADA DE INSTRUCCIÓN PROLONGADA',
  'JIC - JORNADA DE INSTRUCCIÓN CONTINUA',
  'CU - CURSO',
  'FH - FLEXIBILIDAD HORARIA',
  'RJ - REDUCCIÓN DE JORNADA',
  'Otro'
];

const LaborCalendar: React.FC<LaborCalendarProps> = ({ user, onUpdate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<LeaveType>(LEAVE_TYPES[0]);
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    const firstDay = date.getDay() === 0 ? 6 : date.getDay() - 1; 
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const handleDateClick = (dateStr: string) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate(null);
    } else {
      if (dateStr < startDate) {
        setStartDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
    }
  };

  const handleAddLeave = async () => {
    if (!startDate) return;
    
    const finalEndDate = endDate || startDate;
    const newEntry: LeaveEntry = {
      id: crypto.randomUUID(),
      type: selectedType,
      startDate,
      endDate: finalEndDate,
      notes: selectedType === 'PV - PERMISOS VARIOS' ? notes : undefined,
      createdAt: new Date().toISOString()
    };

    // Generate all dates in between
    const dates: string[] = [];
    let current = new Date(startDate);
    const end = new Date(finalEndDate);
    while (current <= end) {
      dates.push(getLocalDateString(current));
      current.setDate(current.getDate() + 1);
    }

    const updatedLeaveDays = [...new Set([...(user.leaveDays || []), ...dates])];
    const updatedLeaveEntries = [...(user.leaveEntries || []), newEntry];

    const updatedUser = {
      ...user,
      leaveDays: updatedLeaveDays,
      leaveEntries: updatedLeaveEntries
    };

    await storageService.updateUser(updatedUser);
    onUpdate(updatedUser);
    
    setStartDate(null);
    setEndDate(null);
    setNotes('');
    setIsAdding(false);
  };

  const handleRemoveEntry = async (entryId: string) => {
    const entry = user.leaveEntries?.find(e => e.id === entryId);
    if (!entry) return;

    // Remove dates associated with this entry
    const datesToRemove: string[] = [];
    let current = new Date(entry.startDate);
    const end = new Date(entry.endDate);
    while (current <= end) {
      datesToRemove.push(getLocalDateString(current));
      current.setDate(current.getDate() + 1);
    }

    const updatedLeaveEntries = (user.leaveEntries || []).filter(e => e.id !== entryId);
    
    // Recalculate leaveDays from remaining entries
    const remainingDates = new Set<string>();
    updatedLeaveEntries.forEach(e => {
      let curr = new Date(e.startDate);
      const en = new Date(e.endDate);
      while (curr <= en) {
        remainingDates.add(getLocalDateString(curr));
        curr.setDate(curr.getDate() + 1);
      }
    });

    const updatedUser = {
      ...user,
      leaveDays: Array.from(remainingDates),
      leaveEntries: updatedLeaveEntries
    };

    await storageService.updateUser(updatedUser);
    onUpdate(updatedUser);
  };

  const isInRange = (dateStr: string) => {
    if (!startDate) return false;
    if (dateStr === startDate) return true;
    if (!endDate) return false;
    return dateStr >= startDate && dateStr <= endDate;
  };

  const getLeaveTypeForDate = (dateStr: string) => {
    return user.leaveEntries?.find(e => dateStr >= e.startDate && dateStr <= e.endDate);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </h4>
          <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-50 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-50 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {['L','M','X','J','V','S','D'].map(d => (
            <div key={d} className="text-center text-[9px] font-black text-gray-300 uppercase py-2">{d}</div>
          ))}
          {daysInMonth.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-10" />;
            const dateStr = getLocalDateString(day);
            const isHolidayDay = isHoliday(day);
            const leaveEntry = getLeaveTypeForDate(dateStr);
            const selected = isInRange(dateStr);
            const isToday = new Date().toDateString() === day.toDateString();

            return (
              <button 
                key={dateStr}
                onClick={() => handleDateClick(dateStr)}
                className={`
                  relative h-10 flex flex-col items-center justify-center rounded-xl transition-all text-[10px] font-black
                  ${selected ? 'bg-yellow-400 text-black z-10 scale-105 shadow-md' : 
                    leaveEntry ? 'bg-red-50 text-red-600 border border-red-100' :
                    isHolidayDay ? 'bg-amber-50 text-amber-700' :
                    isToday ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}
                `}
              >
                <span>{day.getDate()}</span>
                {isHolidayDay && !selected && !leaveEntry && (
                  <div className="absolute bottom-1 w-1 h-1 bg-amber-400 rounded-full" />
                )}
                {leaveEntry && !selected && (
                  <div className="absolute bottom-1 w-1 h-1 bg-red-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-50 border border-amber-100 rounded-full" />
            <span className="text-[8px] font-black uppercase text-gray-400">Festivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-50 border border-red-100 rounded-full" />
            <span className="text-[8px] font-black uppercase text-gray-400">Permiso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full" />
            <span className="text-[8px] font-black uppercase text-gray-400">Selección</span>
          </div>
        </div>
      </div>

      {startDate && (
        <div className="bg-gray-900 text-white rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h5 className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-1">Nuevo Permiso</h5>
              <p className="text-lg font-black uppercase tracking-tight">
                {endDate ? `Del ${new Date(startDate).getDate()} al ${new Date(endDate).getDate()}` : `Día ${new Date(startDate).getDate()}`}
                <span className="text-xs text-gray-400 ml-2">de {new Date(startDate).toLocaleString('es-ES', { month: 'long' })}</span>
              </p>
            </div>
            <button onClick={() => { setStartDate(null); setEndDate(null); }} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-2">Tipo de Permiso</label>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as LeaveType)}
                className="w-full bg-white/10 border border-white/10 rounded-xl p-4 text-xs font-bold outline-none focus:border-yellow-400 transition-colors"
              >
                {LEAVE_TYPES.map(type => (
                  <option key={type} value={type} className="bg-gray-900 text-white">{type}</option>
                ))}
              </select>
            </div>

            {selectedType === 'PV - PERMISOS VARIOS' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-2">Detalle del Permiso (Hospitalización, Grado, etc.)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Hospitalización familiar 1º grado..."
                  className="w-full bg-white/10 border border-white/10 rounded-xl p-4 text-xs font-bold outline-none focus:border-yellow-400 transition-colors h-20 resize-none"
                />
              </div>
            )}

            <button 
              onClick={handleAddLeave}
              className="w-full p-5 bg-yellow-400 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Registrar Permiso
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Permisos Registrados</h5>
        {(!user.leaveEntries || user.leaveEntries.length === 0) ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-100 rounded-[2rem] p-8 text-center">
            <CalendarIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">No hay permisos registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...(user.leaveEntries || [])].sort((a,b) => b.startDate.localeCompare(a.startDate)).map(entry => (
              <div key={entry.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between group hover:border-red-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-black text-[10px]">
                    {entry.type.split(' - ')[0]}
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-gray-900 uppercase leading-none mb-1">
                      {entry.type.split(' - ')[1] || entry.type}
                      {entry.notes && <span className="text-[8px] text-gray-400 ml-2 normal-case font-bold">({entry.notes})</span>}
                    </div>
                    <div className="text-xs font-black text-gray-500 uppercase tracking-tight">
                      {entry.startDate === entry.endDate ? entry.startDate : `Del ${entry.startDate} al ${entry.endDate}`}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveEntry(entry.id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LaborCalendar;
