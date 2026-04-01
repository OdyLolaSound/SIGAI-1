
import React, { useState, useEffect } from 'react';
import { ShieldCheck, ChevronLeft, Crown, User as UserIcon, Home as HomeIcon, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { AppTab, User, CalendarTask, AppNotification } from '../types';
import { storageService } from '../services/storageService';
import { getLocalDateString } from '../services/dateUtils';
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
        const todayStr = getLocalDateString();
        const count = tasks.filter(t => t.startDate === todayStr && t.status !== 'Completada').length;
        setTodayTasksCount(count);
      };
      
      updateBadges();
      const interval = setInterval(updateBadges, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-gray-50 shadow-2xl relative overflow-hidden text-gray-900">
      {/* Header Premium */}
      {!hideHeader && (
        <header className={`p-5 sticky top-0 z-40 flex items-center justify-between border-b shadow-sm transition-all duration-500 ${isMaster ? 'bg-tactical-orange border-black/10' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2">
            {goHome && (
              <button onClick={goHome} className={`p-2 rounded-xl transition-all active:scale-90 ${isMaster ? 'bg-black/10 text-black hover:bg-black/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <HomeIcon className="w-5 h-5" />
              </button>
            )}
            {onBack && (
              <button onClick={onBack} className={`p-2 rounded-xl transition-all active:scale-90 ${isMaster ? 'bg-black/10 text-black hover:bg-black/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 ml-1">
              <div className={`${isMaster ? 'bg-black' : 'bg-tactical-orange'} p-1.5 rounded-lg shadow-md`}>
                {isMaster ? <Crown className="w-4 h-4 text-tactical-orange" /> : <ShieldCheck className="w-4 h-4 text-black fill-black" />}
              </div>
              <h1 className={`text-lg font-black tracking-tighter uppercase ${isMaster ? 'text-black' : 'text-gray-900'}`}>
                {isMaster ? 'MASTER' : 'SIGAI'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <>
                <button 
                  onClick={() => setActiveTab(AppTab.CALENDAR)}
                  className={`p-2.5 rounded-xl relative border transition-all active:scale-90 ${isMaster ? 'bg-black text-tactical-orange border-black/20' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                >
                  <CalendarIcon className="w-5 h-5" />
                  {todayTasksCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-black flex items-center justify-center rounded-full shadow-lg border-2 border-white">
                      {todayTasksCount}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => setShowNotifications(true)}
                  className={`p-2.5 rounded-xl relative border transition-all active:scale-90 ${isMaster ? 'bg-black text-tactical-orange border-black/20' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-black flex items-center justify-center rounded-full shadow-lg border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => setActiveTab(AppTab.SETTINGS)}
                  className={`p-2.5 rounded-xl border transition-all active:scale-90 ${isMaster ? 'bg-black text-tactical-orange border-black/20' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
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
    </div>
  );
};

export default Layout;
