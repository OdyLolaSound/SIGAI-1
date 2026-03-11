
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Scanner from './components/Scanner';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import AIRequestFlow from './components/AIRequestFlow';
import AIMaterialFlow from './components/AIMaterialFlow';
import USACManagerPanel from './components/USACManagerPanel';
import CalendarView from './components/CalendarView';
import UnitDashboard from './components/UnitDashboard';
import GasoilModule from './components/GasoilModule';
import BoilersDashboard from './components/BoilersDashboard';
import SalModule from './components/SalModule';
import TemperatureModule from './components/TemperatureModule';
import MaintenanceModule from './components/MaintenanceModule';
import WaterSyncModule from './components/WaterSyncModule';
import { AppTab, ServiceType, Building, User, Role } from './types';
import { Zap, Droplets, Flame, ShieldCheck, ChevronRight, User as UserIcon, LogOut, Crown, PlusCircle, LayoutGrid, UserPlus, MessageSquare, Package, ClipboardList, Calendar, Users, Bell, Phone, CheckCircle, Info } from 'lucide-react';
import { storageService, BUILDINGS } from './services/storageService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState<Role | null>(null);
  
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [unitMenuOpen, setUnitMenuOpen] = useState(false);

  // Estados para pruebas de notificaciones
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const isMaster = currentUser?.role === 'MASTER';
  const isAuthorized = currentUser?.role === 'USAC' || isMaster;
  
  const hideNav = currentUser !== null;
  const hideHeader = false;

  const handleUnitClick = (role: Role) => {
    if (currentUser && (isMaster || currentUser.role === role)) {
      setUnitMenuOpen(true);
      return;
    }
    setAuthRole(role);
    setShowAuthModal(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    setUnitMenuOpen(true);
    setSelectedService(null);
  };

  const handleTestPush = () => {
    setPushStatus("Simulando envío...");
    setTimeout(() => {
      storageService.addNotification({
        id: crypto.randomUUID(),
        userId: currentUser!.id,
        title: '🔔 PRUEBA DE PUSH',
        message: 'Las notificaciones del sistema SIGAI funcionan correctamente.',
        type: 'system',
        read: false,
        date: new Date().toISOString()
      });
      setPushStatus("✅ ¡Enviado!");
      setTimeout(() => setPushStatus(null), 2000);
    }, 1000);
  };

  const handleTestWhatsApp = () => {
    const phone = currentUser?.phone?.replace(/\+/g, '') || '';
    if (!phone) return alert("Configure su teléfono en el perfil primero.");
    const msg = `🔔 *PRUEBA DE NOTIFICACIÓN SIGAI*\n\nSi has recibido este mensaje, las notificaciones de WhatsApp para la Unidad ${currentUser?.role} están operativas.\n\n_S.E.u.O. USAC 2026_`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleServiceClick = (service: ServiceType) => {
    setSelectedService(service);
    setUnitMenuOpen(false);
    
    if (service === 'luz') {
      const defaultBuilding = BUILDINGS.find(b => b.unit === currentUser?.role) || BUILDINGS[0];
      setSelectedBuilding(defaultBuilding);
      setActiveTab(AppTab.SCAN);
    } else {
      setSelectedBuilding(null);
      setActiveTab(AppTab.HOME);
    }
  };

  const handleRequestClick = (type: 'peticion' | 'material') => {
    if (type === 'peticion') {
      setActiveTab(AppTab.AI_REQUEST);
    } else if (type === 'material') {
      setActiveTab(AppTab.AI_MATERIAL);
    }
  };

  const handleGoHome = () => {
    setActiveTab(AppTab.HOME);
    setUnitMenuOpen(false);
    setSelectedService(null);
    setSelectedBuilding(null);
  };

  const handleBack = () => {
    if ([AppTab.AI_REQUEST, AppTab.AI_MATERIAL, AppTab.USAC_MANAGER, AppTab.CALENDAR, AppTab.TEAM, AppTab.GASOIL, AppTab.BOILERS, AppTab.SALT, AppTab.TEMPERATURES, AppTab.MAINTENANCE, AppTab.WATER_SYNC].includes(activeTab)) {
       setActiveTab(AppTab.HOME);
       setUnitMenuOpen(true);
       return;
    }
    if (activeTab !== AppTab.HOME) { 
      if (selectedService === 'luz' && activeTab === AppTab.SCAN) {
        setSelectedBuilding(null);
        setSelectedService(null);
        setUnitMenuOpen(true);
        setActiveTab(AppTab.HOME);
        return;
      }
      setActiveTab(AppTab.HOME); 
      return; 
    }
    if (selectedBuilding) { setSelectedBuilding(null); }
    else if (selectedService) { setSelectedService(null); setUnitMenuOpen(true); }
    else if (unitMenuOpen) { setUnitMenuOpen(false); }
  };

  const renderContent = () => {
    if (activeTab === AppTab.CALENDAR && currentUser) {
      return <CalendarView user={currentUser} onNavigate={setActiveTab} />;
    }

    if (activeTab === AppTab.BOILERS && currentUser) {
      return <BoilersDashboard user={currentUser} onNavigate={setActiveTab} />;
    }

    if (activeTab === AppTab.GASOIL && currentUser) {
      return <GasoilModule user={currentUser} onNavigate={setActiveTab} />;
    }

    if (activeTab === AppTab.SALT && currentUser) {
      return <SalModule user={currentUser} onNavigate={setActiveTab} />;
    }

    if (activeTab === AppTab.TEMPERATURES && currentUser) {
      return <TemperatureModule user={currentUser} onNavigate={setActiveTab} />;
    }

    if (activeTab === AppTab.MAINTENANCE && currentUser) {
      return <MaintenanceModule user={currentUser} onNavigate={setActiveTab} />;
    }

    if (activeTab === AppTab.WATER_SYNC && currentUser) {
      return <WaterSyncModule user={currentUser} onNavigate={setActiveTab} />;
    }

    if (activeTab === AppTab.TEAM && currentUser) {
      return (
        <div className="p-6 text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100 w-full max-w-sm">
           <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
             Módulo de carga de trabajo en desarrollo v1.1<br/>Consulta las asignaciones en tu Agenda.
           </p>
        </div>
      );
    }

    if (activeTab === AppTab.AI_REQUEST && currentUser) {
      return (
        <AIRequestFlow 
          user={currentUser} 
          onClose={() => { setActiveTab(AppTab.HOME); setUnitMenuOpen(true); }} 
          onComplete={() => { alert("Petición registrada correctamente."); setActiveTab(AppTab.HOME); setUnitMenuOpen(true); }} 
        />
      );
    }

    if (activeTab === AppTab.AI_MATERIAL && currentUser) {
      return (
        <AIMaterialFlow 
          user={currentUser}
          onClose={() => { setActiveTab(AppTab.HOME); setUnitMenuOpen(true); }}
          onComplete={() => { alert("Solicitud de material enviada a almacén."); setActiveTab(AppTab.HOME); setUnitMenuOpen(true); }}
        />
      );
    }

    if (activeTab === AppTab.USAC_MANAGER && currentUser) {
      return (
        <USACManagerPanel 
          currentUser={currentUser} 
        />
      );
    }

    if (!selectedService && !unitMenuOpen && activeTab === AppTab.HOME) {
      return (
        <div className="flex flex-col items-center w-full py-6 animate-in fade-in zoom-in-95 max-w-sm mx-auto">
          <div className="text-center mb-8 px-4">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-1">SIGAI-USAC</h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em]">Gestión de Instalaciones</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full px-2">
            <UnitButton icon="🏢" label='USAC "Rojas Navarrete"' onClick={() => handleUnitClick('USAC')} full />
            <UnitButton icon="🏛️" label="Cuartel General" onClick={() => handleUnitClick('CG')} />
            <UnitButton icon="👥" label="Grupo C. General" onClick={() => handleUnitClick('GCG')} />
            <UnitButton icon="⚔️" label="GOE III" onClick={() => handleUnitClick('GOE3')} />
            <UnitButton icon="⚔️" label="GOE IV" onClick={() => handleUnitClick('GOE4')} />
            <UnitButton icon="🦅" label="BOEL XIX" onClick={() => handleUnitClick('BOEL')} />
            <UnitButton icon="🎖️" label="UMOE" onClick={() => handleUnitClick('UMOE')} />
            <UnitButton icon="📡" label="CECOM" onClick={() => handleUnitClick('CECOM')} />
          </div>

          <div className="w-full px-2 mt-8 space-y-4">
            <button 
              onClick={() => { setAuthRole('USAC'); setShowAuthModal(true); }}
              className="w-full p-6 bg-white border-2 border-gray-900 text-gray-900 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-lg flex items-center justify-center gap-4 active:scale-95 transition-all"
            >
              <UserPlus className="w-5 h-5" /> Solicitar Registro / Alta Técnico
            </button>

            {isAuthorized && (
              <button onClick={() => setActiveTab(AppTab.ADMIN)} className="w-full p-6 bg-gray-900 text-yellow-400 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all">
                <ShieldCheck className="w-5 h-5" /> {isMaster ? 'Control Maestro SIGAI' : 'Panel Gestión USAC'}
              </button>
            )}
          </div>
        </div>
      );
    }

    if (unitMenuOpen && !selectedService && currentUser) {
      return (
        <UnitDashboard 
          user={currentUser}
          onNavigate={setActiveTab}
          onServiceClick={handleServiceClick}
          onRequestClick={handleRequestClick}
        />
      );
    }
    
    if (selectedService && !selectedBuilding) {
      const visibleBuildings = BUILDINGS.filter(b => isMaster || b.unit === currentUser?.role || currentUser?.role === 'USAC');
      return (
        <div className="space-y-4 py-6 w-full max-w-sm mx-auto animate-in slide-in-from-bottom-5">
          <div className="text-center mb-8 px-4">
            <h2 className="text-2xl font-black uppercase tracking-tight">Seleccionar Edificio</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedService.toUpperCase()}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 px-2">
            {visibleBuildings.map(b => (
              <button key={b.id} onClick={() => setSelectedBuilding(b)} className="w-full flex items-center justify-between p-7 bg-white border-2 border-gray-50 rounded-[2.5rem] hover:border-gray-900 transition-all active:scale-95 shadow-sm group">
                <div className="text-left">
                  <div className="font-black text-lg uppercase text-gray-900">{b.name}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{b.code}</div>
                </div>
                <ChevronRight className="text-gray-200 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (selectedBuilding && selectedService) {
      if (activeTab === AppTab.DASHBOARD) return <Dashboard serviceType={selectedService} building={selectedBuilding} role={currentUser!.role} onNavigate={(tab) => setActiveTab(tab)} />;
      if (activeTab === AppTab.HISTORY) return <History serviceType={selectedService} building={selectedBuilding} role={currentUser!.role} onNavigate={(tab) => setActiveTab(tab)} />;
      if (activeTab === AppTab.SCAN) return <Scanner serviceType={selectedService} building={selectedBuilding} user={currentUser!} onComplete={() => setActiveTab(AppTab.DASHBOARD)} />;
    }

    if (activeTab === AppTab.ADMIN && isAuthorized) return <AdminPanel currentUser={currentUser!} />;
    
    if (activeTab === AppTab.SETTINGS && currentUser) return (
      <div className="p-6 space-y-10 max-w-sm mx-auto w-full pb-32">
         <div>
           <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Mi Perfil</h2>
           <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className={`p-4 rounded-2xl ${isMaster ? 'bg-yellow-400 text-black' : 'bg-gray-900 text-yellow-400'}`}>
                   {isMaster ? <Crown /> : <UserIcon />}
                 </div>
                 <div>
                   <div className="font-black uppercase text-sm">{currentUser.name}</div>
                   <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{currentUser.role}</div>
                 </div>
              </div>
              <button onClick={() => { setCurrentUser(null); setUnitMenuOpen(false); setSelectedService(null); setActiveTab(AppTab.HOME); }} className="p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-colors">
                <LogOut />
              </button>
           </div>
         </div>

         {/* Panel de Pruebas de Notificaciones */}
         <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 px-2 flex items-center gap-2">
               <Bell className="w-4 h-4 text-yellow-500" /> Diagnóstico de Alertas
            </h3>
            
            <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm space-y-8">
               <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-gray-400">Push Notifications</span>
                     <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Activo</span>
                  </div>
                  <button 
                    onClick={handleTestPush}
                    className="w-full p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest hover:border-yellow-400 transition-all active:scale-95"
                  >
                    {pushStatus || "Disparar Push de Prueba"}
                  </button>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-gray-400">WhatsApp Business</span>
                     <span className={currentUser.phone ? "text-green-500 flex items-center gap-1" : "text-amber-500 flex items-center gap-1"}>
                        {currentUser.phone ? <><CheckCircle className="w-3 h-3" /> Configurado</> : <><Info className="w-3 h-3" /> Sin teléfono</>}
                     </span>
                  </div>
                  <button 
                    onClick={handleTestWhatsApp}
                    className="w-full p-6 bg-green-200 border-2 border-dashed border-green-300 text-green-700 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest hover:bg-green-100 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Phone className="w-4 h-4" /> Enviar Mensaje wa.me
                  </button>
               </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4">
               <ShieldCheck className="w-8 h-8 text-amber-500 shrink-0" />
               <p className="text-[9px] font-bold text-amber-800 uppercase leading-relaxed tracking-tight">
                 Si las notificaciones no llegan, verifique que los permisos de su navegador estén habilitados para este dominio.
               </p>
            </div>
         </div>
      </div>
    );

    return null;
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onBack={(activeTab !== AppTab.HOME || selectedService || unitMenuOpen) ? handleBack : undefined}
      goHome={handleGoHome}
      hideNav={hideNav}
      user={currentUser}
      hideHeader={hideHeader}
    >
      <div className="flex flex-col items-center w-full">
        {renderContent()}
      </div>
      {showAuthModal && authRole && <AuthModal initialRole={authRole} onLogin={handleLoginSuccess} onClose={() => setShowAuthModal(false)} />}
    </Layout>
  );
};

const UnitButton: React.FC<{ icon: string, label: string, onClick: () => void, full?: boolean }> = ({ icon, label, onClick, full }) => (
  <button 
    onClick={onClick} 
    className={`${full ? 'col-span-2 aspect-auto py-8' : 'aspect-square'} flex flex-col items-center justify-center bg-white rounded-[2.5rem] p-4 shadow-xl transition-all active:scale-95 border-4 border-transparent hover:border-gray-900 group`}
  >
    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
    <div className="font-black uppercase tracking-tighter text-[10px] text-gray-900 text-center leading-none px-2">{label}</div>
  </button>
);

export default App;
