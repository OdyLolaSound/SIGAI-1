
import React, { useState } from 'react';
import { UserCheck, ShieldCheck, Building2, UserX, Check, Lock, RefreshCcw, Crown, CheckCircle2 } from 'lucide-react';
import { User, Building, Role } from '../types';
import { storageService, BUILDINGS } from '../services/storageService';

interface AdminPanelProps {
  currentUser: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>(storageService.getUsers());
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [tempBuildings, setTempBuildings] = useState<string[]>([]);
  const [tempUnits, setTempUnits] = useState<Role[]>([]);
  const isMaster = currentUser.role === 'MASTER';

  const handleApprove = (userId: string) => {
    setEditingUserId(userId);
    const user = users.find(u => u.id === userId);
    setTempBuildings(user?.assignedBuildings || []);
    setTempUnits(user?.assignedUnits || []);
  };

  const saveApproval = (userId: string) => {
    storageService.updateUserStatus(userId, 'approved', tempBuildings, tempUnits);
    setUsers(storageService.getUsers());
    setEditingUserId(null);
  };

  const handleResetPass = (userId: string) => {
    const newPass = prompt('Introduzca la nueva contraseña para el usuario:');
    if (newPass) {
      storageService.resetUserPassword(userId, newPass);
      alert('Contraseña actualizada con éxito');
    }
  };

  const handleReject = (userId: string) => {
    if (confirm('¿Rechazar este registro de usuario?')) {
      storageService.updateUserStatus(userId, 'rejected', [], []);
      setUsers(storageService.getUsers());
    }
  };

  const toggleBuilding = (id: string) => {
    setTempBuildings(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const toggleUnit = (role: Role) => {
    setTempUnits(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const ROLES_LIST: Role[] = ['USAC', 'CG', 'GCG', 'GOE3', 'GOE4', 'BOEL', 'UMOE', 'CECOM'];

  // El Master ve a TODOS excepto a sí mismo. El Admin USAC solo ve a técnicos de otras unidades.
  const filteredUsers = users.filter(u => u.id !== currentUser.id);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
          {isMaster ? 'GESTIÓN MAESTRA DE PERSONAL' : 'GESTIÓN DE PERSONAL'}
        </h2>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
          {isMaster ? 'Control Supremo SIGAI' : 'Administración Central USAC'}
        </p>
      </div>

      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No hay usuarios para gestionar</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className={`bg-white border rounded-[2.5rem] p-6 shadow-sm transition-all ${user.status === 'pending' ? 'border-yellow-200' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${user.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'}`}>
                    {user.role === 'MASTER' ? <Crown className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                  </div>
                  <div className="text-left">
                    <div className="font-black uppercase text-sm leading-none mb-1">{user.name}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unidad: {user.role} | @{user.username}</div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${user.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {user.status === 'approved' ? 'Activo' : 'Pendiente'}
                </div>
              </div>

              {editingUserId === user.id ? (
                <div className="space-y-6 border-t border-gray-50 pt-6 animate-in slide-in-from-top-4">
                  
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-3">Unidades Autorizadas (Botones):</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ROLES_LIST.map(role => (
                        <button key={role} onClick={() => toggleUnit(role)} className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${tempUnits.includes(role) ? 'border-blue-400 bg-blue-50 text-blue-900' : 'border-gray-50 bg-gray-50 text-gray-400'}`}>
                          <CheckCircle2 className={`w-3 h-3 ${tempUnits.includes(role) ? 'opacity-100' : 'opacity-20'}`} />
                          <span className="text-[10px] font-black uppercase">{role}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-3">Edificios Autorizados (Lecturas):</p>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                      {BUILDINGS.map(b => (
                        <button key={b.id} onClick={() => toggleBuilding(b.id)} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${tempBuildings.includes(b.id) ? 'border-yellow-400 bg-yellow-50 text-gray-900' : 'border-gray-50 bg-gray-50 text-gray-400'}`}>
                          <div className="flex items-center gap-3">
                             <Building2 className="w-4 h-4" />
                             <span className="text-[10px] font-bold uppercase">{b.name} ({b.code})</span>
                          </div>
                          {tempBuildings.includes(b.id) && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => saveApproval(user.id)} className="w-full p-5 bg-gray-900 text-yellow-400 rounded-[2rem] font-black uppercase text-xs tracking-widest mt-2 shadow-xl active:scale-95 transition-all">
                    Guardar Configuración de Acceso
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(user.id)} className="flex-[2] p-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors">Gestionar</button>
                  {isMaster && (
                    <button onClick={() => handleResetPass(user.id)} title="Reset Password" className="p-3 bg-blue-50 text-blue-600 rounded-2xl active:scale-90 transition-all">
                      <Lock className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={() => handleReject(user.id)} className="p-3 bg-red-50 text-red-500 rounded-2xl active:scale-90 transition-all"><UserX className="w-5 h-5" /></button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
