
import React, { useState, useEffect } from 'react';
import { Home, Camera, History, Settings, ShieldCheck, ChevronLeft, Building2, Crown, User as UserIcon, Home as HomeIcon, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { AppTab, User, CalendarTask, AppNotification } from '../types';
import { storageService } from '../services/storageService';
import NotificationCenter from './NotificationCenter';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onBack?: () => void;
  goHome?: () => void;
  hideNav?: boolean;
  hideHeader?: boolean;
  user?: User | null;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onBack, goHome, hideNav, hideHeader, user }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [todayTasksCount, setTodayTasksCount] = useState(0);

  const isMaster = user?.role === 'MASTER';
  const isUSAC = user?.role === 'USAC' || isMaster;

  useEffect(() => {
    if (user) {
      const updateBadges = () => {
        const notifications = storageService.getNotifications(user.id);
        setUnreadCount(notifications.filter(n => !n.read).length);

        const tasks = storageService.getTasks();
        const todayStr = new Date().toISOString().split('T')[0];
        const count = tasks.filter(t => t.startDate === todayStr && t.status !== 'Completada').length;
        setTodayTasksCount(count);
      };
      
      updateBadges();
      const interval = setInterval(updateBadges, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen pb-12 max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden">
      {/* Header Premium */}
      {!hideHeader && (
        <header className={`p-5 sticky top-0 z-40 flex items-center justify-between border-b shadow-lg transition-all duration-500 ${isMaster ? 'bg-yellow-400 border-yellow-600' : 'bg-gray-900 border-white/5'}`}>
          <div className="flex items-center gap-2">
            {goHome && (
              <button onClick={goHome} className={`p-1.5 rounded-xl transition-colors ${isMaster ? 'bg-black/10 text-black hover:bg-black/20' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                <HomeIcon className="w-5 h-5" />
              </button>
            )}
            {onBack && (
              <button onClick={onBack} className={`p-1.5 rounded-xl transition-colors ${isMaster ? 'bg-black/10 text-black hover:bg-black/20' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 ml-1">
              <div className={`${isMaster ? 'bg-black' : 'bg-yellow-400'} p-1.5 rounded-lg shadow-inner`}>
                {isMaster ? <Crown className="w-4 h-4 text-yellow-400" /> : <ShieldCheck className="w-4 h-4 text-black fill-black" />}
              </div>
              <h1 className={`text-lg font-black tracking-tighter uppercase ${isMaster ? 'text-black' : 'text-white'}`}>
                {isMaster ? 'MASTER' : 'SIGAI'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <>
                <button 
                  onClick={() => setActiveTab(AppTab.CALENDAR)}
                  className={`p-2 rounded-xl relative border transition-all active:scale-95 ${isMaster ? 'bg-black text-yellow-400 border-black/20' : 'bg-white/10 text-white border-white/10'}`}
                >
                  <CalendarIcon className="w-5 h-5" />
                  {todayTasksCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-black flex items-center justify-center rounded-full shadow-lg border-2 border-gray-900">
                      {todayTasksCount}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => setShowNotifications(true)}
                  className={`p-2 rounded-xl relative border transition-all active:scale-95 ${isMaster ? 'bg-black text-yellow-400 border-black/20' : 'bg-white/10 text-white border-white/10'}`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-black flex items-center justify-center rounded-full shadow-lg border-2 border-gray-900">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => setActiveTab(AppTab.SETTINGS)}
                  className={`p-2 rounded-xl border transition-all active:scale-95 ${isMaster ? 'bg-black text-yellow-400 border-black/20' : 'bg-white/10 text-white border-white/10'}`}
                >
                  <UserIcon className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 p-5 w-full flex flex-col items-center">
        {children}
      </main>

      {showNotifications && user && (
        <NotificationCenter 
          userId={user.id} 
          onClose={() => setShowNotifications(false)} 
          onTaskClick={(taskId) => {
            setShowNotifications(false);
            setActiveTab(AppTab.CALENDAR);
          }}
        />
      )}

      {/* Barra de navegación inferior */}
      {!hideNav && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] bg-gray-900/95 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-around py-3 px-2 z-50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 animate-in slide-in-from-bottom-10 duration-500">
          <NavItem icon={<Home className="w-5 h-5" />} label="Inicio" active={activeTab === AppTab.HOME} onClick={() => setActiveTab(AppTab.HOME)} />
          {isUSAC && (
            <>
              <NavItem icon={<History className="w-5 h-5" />} label="Historial" active={activeTab === AppTab.HISTORY} onClick={() => setActiveTab(AppTab.HISTORY)} />
              <button onClick={() => setActiveTab(AppTab.SCAN)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 relative -top-2 ${activeTab === AppTab.SCAN ? 'bg-white text-black rotate-90' : 'bg-yellow-400 text-black hover:scale-105'}`}>
                <Camera className="w-7 h-7" />
              </button>
              <NavItem icon={<Building2 className="w-5 h-5" />} label="Panel" active={activeTab === AppTab.DASHBOARD} onClick={() => setActiveTab(AppTab.DASHBOARD)} />
            </>
          )}
          <NavItem icon={<Settings className="w-5 h-5" />} label="Perfil" active={activeTab === AppTab.SETTINGS} onClick={() => setActiveTab(AppTab.SETTINGS)} />
        </nav>
      )}
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 px-3 transition-all duration-300 ${active ? 'text-yellow-400 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
    <div>{icon}</div>
    <span className="text-[7px] font-black uppercase tracking-[0.15em]">{label}</span>
  </button>
);

export default Layout;
