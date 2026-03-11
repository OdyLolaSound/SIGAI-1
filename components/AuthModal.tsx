
import React, { useState } from 'react';
import { ShieldCheck, User as UserIcon, Lock, ChevronLeft, ChevronRight, UserPlus, AlertCircle, Crown } from 'lucide-react';
import { Role, User } from '../types';
import { storageService } from '../services/storageService';

interface AuthModalProps {
  initialRole: Role;
  onLogin: (user: User) => void;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ initialRole, onLogin, onClose }) => {
  const [view, setView] = useState<'login' | 'register' | 'pending'>('login');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: initialRole,
    isManto: false
  });
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = storageService.getUsers();
    
    const user = users.find(u => {
      const matchCredentials = u.username === formData.username && u.password === formData.password;
      if (!matchCredentials) return false;
      if (u.role === 'MASTER') return true; 
      // Si estamos en el modal de una unidad específica, permitimos al usuario entrar si su rol coincide
      return u.role === initialRole;
    });

    if (!user) {
      setError('Credenciales incorrectas o acceso no autorizado para esta unidad');
      return;
    }

    if (user.status !== 'approved') {
      setView('pending');
      return;
    }

    onLogin(user);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    const existing = storageService.getUsers().find(u => u.username === formData.username);
    if (existing) {
      setError('El nombre de usuario ya está registrado');
      return;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name: formData.name,
      username: formData.username,
      password: formData.password,
      role: formData.role,
      status: 'pending',
      assignedBuildings: [],
      assignedUnits: [],
      isManto: formData.isManto,
      leaveDays: []
    };

    storageService.saveUser(newUser);
    setView('pending');
  };

  if (view === 'pending') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-10 text-center shadow-2xl relative">
          <button onClick={onClose} className="absolute top-6 left-6 p-2 text-gray-400 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-xl font-black uppercase mb-3">Solicitud Enviada</h2>
          <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">
            Tu registro como técnico de <strong>{formData.role}</strong> está pendiente de validación central.
          </p>
          <button onClick={onClose} className="w-full p-5 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 transition-all">
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative">
        <button 
          onClick={view === 'register' ? () => setView('login') : onClose} 
          className="absolute top-8 left-8 p-2 text-gray-400 hover:text-gray-900 transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="p-10 pt-14">
          <div className="flex justify-center mb-8">
            <div className="bg-gray-900 p-4 rounded-3xl shadow-xl rotate-3">
               <ShieldCheck className="w-10 h-10 text-yellow-400 -rotate-3" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-center uppercase tracking-tighter mb-1">
            {view === 'login' ? 'Acceso SIGAI' : 'Registro Técnico'}
          </h2>
          <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mb-10">Unidad: {initialRole}</p>

          <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {error && <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black rounded-2xl border border-red-100 uppercase">{error}</div>}
            
            {view === 'register' && (
              <div className="relative">
                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Nombre y Apellidos" 
                  className="w-full p-5 pl-14 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-gray-900/10 text-[11px] font-bold border border-gray-100"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}

            <div className="relative">
              <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Nombre de Usuario (Email)" 
                className="w-full p-5 pl-14 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-gray-900/10 text-[11px] font-bold border border-gray-100"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="password" 
                placeholder="Contraseña" 
                className="w-full p-5 pl-14 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-gray-900/10 text-[11px] font-bold border border-gray-100"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            {view === 'register' && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-400 rounded-lg">
                    <Crown className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase">Técnico Manto</p>
                    <p className="text-[8px] text-gray-400 font-bold uppercase">Personal de Mantenimiento USAC</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded-lg border-gray-300 text-gray-900 focus:ring-gray-900"
                  checked={formData.isManto}
                  onChange={e => setFormData({...formData, isManto: e.target.checked})}
                />
              </div>
            )}

            <button type="submit" className="w-full p-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 hover:bg-black">
              {view === 'login' ? 'Entrar' : 'Registrarse'} <ChevronRight className="w-4 h-4 text-yellow-400" />
            </button>
          </form>
        </div>

        <div className="p-8 bg-gray-50 text-center flex flex-col gap-4">
          {view === 'login' ? (
            <button onClick={() => setView('register')} className="text-[10px] font-black uppercase text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" /> Solicitar Registro en {initialRole}
            </button>
          ) : (
            <button onClick={() => setView('login')} className="text-[10px] font-black uppercase text-gray-500 hover:text-gray-900 transition-colors">
              Ya tengo una cuenta, entrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
