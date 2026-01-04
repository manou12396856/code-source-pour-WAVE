
import React, { useState, useEffect } from 'react';
/* Added RefreshCw and LogOut to the imports from lucide-react */
import { Smartphone, LayoutDashboard, UserCheck, FileText, Camera, MapPin, Phone, User as UserIcon, Settings, Calendar, Briefcase, TrendingUp, ChevronRight, Package, Send, MessageSquare, ClipboardList, Bell, Save, CheckCircle2, Languages, Globe, Edit3, ClipboardCheck, Clock, Lock, AlertCircle, SaveIcon, MapPinned, Trophy, Target, Search, Users, Mic, MicOff, Copy, History, Sparkles, PhoneCall, RefreshCw, X, Megaphone, LogOut } from 'lucide-react';
import Header from './components/Header';
import StockCard from './components/StockCard';
import ActionButton from './components/ActionButton';
import TargetBar from './components/TargetBar';
import MaterialSelectorModal from './components/MaterialSelectorModal';
import SupervisorDashboard from './components/SupervisorDashboard';
import { storage } from './services/storage';
import { User, MerchantType, PerformanceTarget, StockItem, PeriodType, AgentProgress, GlobalSettings, DailyReport, PeriodTargets, Language } from './types';
import { INITIAL_STOCK } from './mockData';

const translations = {
  fr: {
    nav: { main: 'Tableau', reports: 'Rapports', profile: 'Profil', settings: 'Cibles' },
    auth: { login: 'Entrer', signup: 'Créer un compte', phone: 'Numéro de téléphone', back: 'Annuler', finalize: "Finaliser l'inscription", photo: 'Ma Photo de Profil', fname: 'Prénom', lname: 'Nom', zone: 'Zone de travail', unknown: 'Numéro inconnu.' },
    agent: { 
      stock: 'Stock Actuel', 
      inventory: "Inventaire", 
      endDay: 'Fin de journée', 
      confirm: 'Confirmer', 
      usage: 'Matériel utilisé', 
      auto: 'Calcul automatique', 
      reportSent: 'Rapport envoyé !', 
      reportLocked: 'Rapport à 17h00', 
      timeAlert: 'Il est 17h00 ! Envoyez votre rapport.', 
      visitAdded: 'Visite enregistrée !',
      prospectionAdded: 'Prospection enregistrée !',
      todayTitle: 'Mon Travail du Jour',
      progressionTitle: 'Ma Progression Personnelle',
      teamProgressionTitle: 'Objectifs Équipe',
      historyTitle: 'Mon Historique Récent',
      goalReached: 'Objectif Atteint !',
      noBroadcast: 'Aucune annonce pour le moment.'
    },
    sup: { targets: 'Cibles Équipe', publish: 'Publier les objectifs', synchronize: 'Synchro...', impact: "Impact", flash: 'Flash Info', diffuse: 'Diffuser', reports: "Rapports", directory: "Annuaire Équipe", broadcastTitle: "Diffuser une annonce", broadcastPlaceholder: "Écrivez votre message ici..." },
    periods: { today: 'Jour', cycle: 'Cycle (2m)', week: 'Semaine', month: 'Mois' },
    profile: { coordinates: 'Coordonnées', language: 'Langue', preferences: 'Préférences', logout: 'Déconnexion' }
  },
  en: {
    nav: { main: 'Dashboard', reports: 'Reports', profile: 'Profile', settings: 'Targets' },
    auth: { login: 'Login', signup: 'Create Account', phone: 'Phone Number', back: 'Cancel', finalize: "Finalize Registration", photo: 'My Profile Photo', fname: 'First Name', lname: 'Last Name', zone: 'Work Zone', unknown: 'Unknown number.' },
    agent: { 
      stock: 'Current Stock', 
      inventory: "Inventory", 
      endDay: 'End of Day', 
      confirm: 'Confirm', 
      usage: 'Material used', 
      auto: 'Auto-calculate', 
      reportSent: 'Report sent!', 
      reportLocked: 'Reporting at 5:00 PM', 
      timeAlert: 'It is 5:00 PM! Send your report.', 
      visitAdded: 'Visit recorded!',
      prospectionAdded: 'Prospection recorded!',
      todayTitle: "My Today's Work",
      progressionTitle: 'My Personal Progression',
      teamProgressionTitle: 'Team Objectives',
      historyTitle: 'My Recent History',
      goalReached: 'Goal Reached!',
      noBroadcast: 'No announcements at the moment.'
    },
    sup: { targets: 'Team Targets', publish: 'Publish Targets', synchronize: 'Syncing...', impact: "Impact", flash: 'Flash Info', diffuse: 'Broadcast', reports: "Reports", directory: "Team Directory", broadcastTitle: "Broadcast Announcement", broadcastPlaceholder: "Type your message here..." },
    periods: { today: 'Day', cycle: 'Cycle (2m)', week: 'Week', month: 'Month' },
    profile: { coordinates: 'Coordinates', language: 'Language', preferences: 'Preferences', logout: 'Logout' }
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(storage.getCurrentUser());
  const [view, setView] = useState<'login' | 'signup_choice' | 'signup_agent' | 'signup_sup'>('login');
  const [activeTab, setActiveTab] = useState<'main' | 'reports' | 'profile' | 'settings'>('main');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('today');
  const [settings, setSettings] = useState<GlobalSettings>(storage.getSettings());
  const [language, setLanguage] = useState<Language>(storage.getLanguage());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [lastReadBroadcast, setLastReadBroadcast] = useState<number>(() => {
    return Number(localStorage.getItem('wave_last_read_broadcast')) || 0;
  });

  const t = (path: string) => {
    const keys = path.split('.');
    let result: any = translations[language];
    for (const key of keys) result = result ? result[key] : null;
    return result || path;
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    storage.setLanguage(newLang);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isReportingTime = currentTime.getHours() >= 17;
  const formattedToday = currentTime.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' });

  const [stock, setStock] = useState<StockItem[]>(() => {
    if (!currentUser) return INITIAL_STOCK;
    const saved = localStorage.getItem(`stock_${currentUser.id}`);
    return saved ? JSON.parse(saved) : INITIAL_STOCK;
  });
  
  const [dailyUsage, setDailyUsage] = useState<Record<string, number>>(() => {
    if (!currentUser) return {};
    const saved = localStorage.getItem(`usage_${currentUser.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [progress, setProgress] = useState<AgentProgress | null>(null);
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({});
  const [activeMerchantType, setActiveMerchantType] = useState<MerchantType | null>(null);
  const [isEndOfDayModalOpen, setIsEndOfDayModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

  const refreshTeamProgress = () => {
    const allAgents = storage.getUsers().filter(u => u.role === 'agent');
    const totals: Record<string, number> = {};
    allAgents.forEach(agent => {
      const p = storage.getAgentProgress(agent.id);
      const periodCounts = p.counts[selectedPeriod];
      Object.entries(periodCounts).forEach(([cat, val]) => {
        totals[cat] = (totals[cat] || 0) + (val as number);
      });
    });
    setTeamCounts(totals);
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`stock_${currentUser.id}`, JSON.stringify(stock));
      localStorage.setItem(`usage_${currentUser.id}`, JSON.stringify(dailyUsage));
    }
  }, [stock, dailyUsage, currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'agent') {
      setProgress(storage.getAgentProgress(currentUser.id));
    }
    setSettings(storage.getSettings());
    refreshTeamProgress();
  }, [currentUser, activeTab, selectedPeriod]);

  // Periodic settings sync (for broadcasts)
  useEffect(() => {
    const it = setInterval(() => {
      setSettings(storage.getSettings());
    }, 5000);
    return () => clearInterval(it);
  }, []);

  const handleActionClick = (type: MerchantType) => {
    if (type === 'Visite' || type === 'Prospection') {
      if (!progress || !currentUser) return;
      const newProgress: AgentProgress = {
        ...progress,
        counts: {
          today: { ...progress.counts.today, [type]: (progress.counts.today[type] || 0) + 1 },
          week: { ...progress.counts.week, [type]: (progress.counts.week[type] || 0) + 1 },
          month: { ...progress.counts.month, [type]: (progress.counts.month[type] || 0) + 1 },
          cycle: { ...progress.counts.cycle, [type]: (progress.counts.cycle[type] || 0) + 1 },
        }
      };
      setProgress(newProgress);
      storage.updateAgentProgress(newProgress);
      refreshTeamProgress();
      const feedback = document.createElement('div');
      feedback.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#009FE3] text-white px-6 py-3 rounded-2xl font-black text-sm shadow-2xl z-[100] animate-bounce';
      feedback.innerText = type === 'Visite' ? (language === 'fr' ? '✅ VISITE ENREGISTRÉE' : '✅ VISIT RECORDED') : (language === 'fr' ? '🔍 PROSPECTION ENREGISTRÉE' : '🔍 PROSPECTION RECORDED');
      document.body.appendChild(feedback);
      setTimeout(() => feedback.remove(), 1500);
    } else {
      setActiveMerchantType(type);
    }
  };

  const handleConfirmAction = (usedMaterials: Record<string, number>) => {
    if (!progress || !currentUser || !activeMerchantType) return;
    setStock(prev => prev.map(item => ({
      ...item,
      quantity: Math.max(0, item.quantity - (usedMaterials[item.id] || 0))
    })));
    setDailyUsage(prev => {
      const next = { ...prev };
      Object.entries(usedMaterials).forEach(([id, qty]) => { next[id] = (next[id] || 0) + qty; });
      return next;
    });
    const newProgress: AgentProgress = {
      ...progress,
      counts: {
        today: { ...progress.counts.today, [activeMerchantType]: (progress.counts.today[activeMerchantType] || 0) + 1 },
        week: { ...progress.counts.week, [activeMerchantType]: (progress.counts.week[activeMerchantType] || 0) + 1 },
        month: { ...progress.counts.month, [activeMerchantType]: (progress.counts.month[activeMerchantType] || 0) + 1 },
        cycle: { ...progress.counts.cycle, [activeMerchantType]: (progress.counts.cycle[activeMerchantType] || 0) + 1 },
      }
    };
    setProgress(newProgress);
    storage.updateAgentProgress(newProgress);
    refreshTeamProgress();
    setActiveMerchantType(null);
  };

  const submitFinalReport = (data: Partial<DailyReport>) => {
    if (!currentUser || !progress) return;
    const totalCreations = (Object.entries(progress.counts.today) as [MerchantType, number][])
      .filter(([t]) => t !== 'Visite' && t !== 'Prospection')
      .reduce((a, [, b]) => a + b, 0);
    
    const report: DailyReport = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.firstName,
      lastName: currentUser.lastName,
      date: new Date().toISOString(),
      prospections: progress.counts.today['Prospection'] || 0,
      creations: totalCreations,
      visites: progress.counts.today['Visite'] || 0,
      faitsTerrain: data.faitsTerrain || '',
      materielUtilise: { ...dailyUsage },
      zone: currentUser.zone || ''
    };
    storage.saveDailyReport(report);
    setDailyUsage({});
    setIsEndOfDayModalOpen(false);
    alert(t('agent.reportSent'));
  };

  const handleBroadcastSubmit = (message: string) => {
    if (!currentUser) return;
    const newSettings = {
      ...settings,
      broadcast: {
        message,
        timestamp: Date.now(),
        author: currentUser.firstName
      }
    };
    storage.updateSettings(newSettings);
    setSettings(newSettings);
    setIsBroadcastModalOpen(false);
  };

  const handleOpenBroadcast = () => {
    setIsBroadcastModalOpen(true);
    if (currentUser?.role === 'agent' && settings.broadcast) {
      setLastReadBroadcast(settings.broadcast.timestamp);
      localStorage.setItem('wave_last_read_broadcast', String(settings.broadcast.timestamp));
    }
  };

  const hasUnreadBroadcast = currentUser?.role === 'agent' && settings.broadcast && settings.broadcast.timestamp > lastReadBroadcast;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col p-6 items-center justify-center">
        <div className="w-20 h-20 bg-[#009FE3] rounded-[28px] flex items-center justify-center mb-6 shadow-xl shadow-blue-100">
          <Smartphone size={40} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-2 text-center">Wave CI</h1>
        {view === 'login' && (
          <form className="w-full max-w-xs space-y-4" onSubmit={(e) => {
            e.preventDefault();
            const phone = (e.target as any).phone.value;
            const user = storage.findUserByPhone(phone);
            if (user) { storage.setCurrentUser(user.id); setCurrentUser(user); }
            else alert(t('auth.unknown'));
          }}>
            <input name="phone" type="tel" placeholder={t('auth.phone')} className="w-full px-6 py-4 bg-gray-50 border border-slate-200 rounded-2xl outline-none text-slate-900 placeholder-slate-400 focus:border-[#009FE3]" required />
            <button className="w-full py-4 bg-[#009FE3] text-white font-bold rounded-2xl shadow-lg">{t('auth.login')}</button>
            <button type="button" onClick={() => setView('signup_choice')} className="w-full text-center text-[#009FE3] font-bold text-sm mt-4 underline">{t('auth.signup')}</button>
          </form>
        )}
        {view === 'signup_choice' && (
           <div className="w-full max-w-xs space-y-4">
              <button onClick={() => setView('signup_agent')} className="w-full p-6 border rounded-[24px] flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-blue-100 text-[#009FE3] rounded-full flex items-center justify-center"><UserIcon /></div>
                <div><p className="font-bold">Agent Opener</p><p className="text-xs text-gray-400">Terrain</p></div>
              </button>
              <button onClick={() => setView('signup_sup')} className="w-full p-6 border rounded-[24px] flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center"><UserCheck /></div>
                <div><p className="font-bold">Superviseur</p><p className="text-xs text-gray-400">Équipe</p></div>
              </button>
           </div>
        )}
        {(view === 'signup_agent' || view === 'signup_sup') && (
          <SignupForm isAgent={view === 'signup_agent'} t={t} onSubmit={(u: any) => { storage.saveUser(u); storage.setCurrentUser(u.id); setCurrentUser(u); }} onBack={() => setView('signup_choice')} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-32">
      <Header 
        userName={currentUser.firstName} 
        role={currentUser.role} 
        onLogout={() => { storage.setCurrentUser(null); setCurrentUser(null); }} 
        onBellClick={handleOpenBroadcast}
        hasUnread={hasUnreadBroadcast}
      />
      
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {activeTab === 'main' && (
          currentUser.role === 'supervisor' ? <SupervisorDashboard t={t} language={language} /> : (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
               <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 text-[#009FE3] rounded-xl flex items-center justify-center"><Target size={18} /></div>
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">
                        {formattedToday}
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-slate-50 p-3 rounded-2xl text-center">
                      <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Pros.</p>
                      <p className="text-sm font-black text-[#009FE3]">{progress?.counts.today['Prospection'] || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl text-center">
                      <p className="text-[7px] font-black text-gray-400 uppercase mb-1">{language === 'fr' ? 'Créas.' : 'Acq.'}</p>
                      <p className="text-sm font-black text-blue-900">{(Object.entries(progress?.counts.today || {}) as [string, number][]).filter(([k]) => k !== 'Visite' && k !== 'Prospection').reduce((a, [,b]) => a+b, 0)}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl text-center">
                      <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Visites</p>
                      <p className="text-sm font-black text-[#009FE3]">{progress?.counts.today['Visite'] || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl text-center">
                      <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Stock</p>
                      <p className="text-sm font-black text-gray-800">{stock.reduce((a, b) => a + b.quantity, 0)}</p>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-3">
                  <ActionButton type="Fixe" onClick={handleActionClick} />
                  <ActionButton type="Ambulant" onClick={handleActionClick} />
                  <ActionButton type="Visite" onClick={handleActionClick} />
                  <ActionButton type="Prospection" onClick={handleActionClick} />
                  <ActionButton type="Taxi" onClick={handleActionClick} />
                  <ActionButton type="Moto Taxi" onClick={handleActionClick} />
               </div>

               <div className="bg-gradient-to-br from-blue-900 via-[#009FE3] to-blue-400 rounded-[32px] p-6 shadow-xl shadow-blue-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse"></div>
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"><Users size={18} /></div>
                      <h3 className="text-xs font-black uppercase tracking-widest">{t('agent.teamProgressionTitle')}</h3>
                    </div>
                  </div>
                  <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl mb-6 relative z-10">
                    {(['today', 'week', 'month', 'cycle'] as PeriodType[]).map(p => (
                      <button key={p} onClick={() => setSelectedPeriod(p)} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${selectedPeriod === p ? 'bg-white text-blue-900 shadow-sm' : 'text-white/60'}`}>
                        {t(`periods.${p}`)}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-4 relative z-10">
                    {['Prospection', 'Fixe', 'Ambulant', 'Taxi', 'Moto Taxi'].map(cat => {
                      const current = teamCounts[cat] || 0;
                      const target = settings.teamTargets[selectedPeriod][cat as MerchantType] || 10;
                      const isDone = current >= target;
                      return (
                        <div key={cat}>
                          <div className="flex justify-between items-center mb-1 text-white/80">
                            <span className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                              {cat} {isDone && <Sparkles size={10} className="text-yellow-400" />}
                            </span>
                            <span className="text-[10px] font-black">
                              <span className="text-white text-xs">{current}</span> / {target}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
                             <div 
                                className={`h-full transition-all duration-1000 ${isDone ? 'bg-gradient-to-r from-yellow-300 to-yellow-500' : 'bg-white shadow-[0_0_8px_white]'}`}
                                style={{ width: `${Math.min(100, (current / target) * 100)}%` }}
                             />
                          </div>
                          {isDone && (
                            <div className="mt-1 flex items-center gap-1">
                              <CheckCircle2 size={10} className="text-yellow-400" />
                              <span className="text-[8px] font-bold text-yellow-300 uppercase animate-pulse">{t('agent.goalReached')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
               </div>

               <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center"><Trophy size={18} /></div>
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">{t('agent.progressionTitle')}</h3>
                  </div>
                  {progress && (['Prospection', 'Fixe', 'Ambulant', 'Taxi', 'Moto Taxi'] as MerchantType[]).map(cat => (
                    <TargetBar key={cat} category={cat} current={progress.counts[selectedPeriod][cat] || 0} target={settings.individualTargets[selectedPeriod][cat] || 10} />
                  ))}
               </div>

               <AgentHistorySection t={t} filterUserId={currentUser.id} />

               <div className="flex gap-2">
                 <button onClick={() => setIsInventoryModalOpen(true)} className="flex-1 py-5 bg-white border border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 font-bold text-xs shadow-sm">
                    <Edit3 size={18} /> {t('agent.inventory')}
                 </button>
                 <button 
                  onClick={() => isReportingTime ? setIsEndOfDayModalOpen(true) : alert(t('agent.reportLocked'))} 
                  className={`flex-[2] py-5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-xl transition-all ${isReportingTime ? 'bg-[#009FE3] text-white shadow-blue-100 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed grayscale'}`}
                 >
                    {isReportingTime ? <Send size={18} /> : <Lock size={18} />}
                    {t('agent.endDay')}
                 </button>
               </div>
            </div>
          )
        )}
        {activeTab === 'reports' && (
          currentUser.role === 'supervisor' ? <TeamReportsList supervisor={true} language={language} /> : <TeamReportsList supervisor={false} filterUserId={currentUser.id} language={language} />
        )}
        {activeTab === 'profile' && <ProfileSection user={currentUser} t={t} language={language} onLanguageChange={handleLanguageChange} />}
        {activeTab === 'settings' && currentUser.role === 'supervisor' && (
          <SupervisorSettingsPanel t={t} settings={settings} onUpdate={(s) => { storage.updateSettings(s); setSettings(s); }} />
        )}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-white/95 backdrop-blur-md border shadow-2xl rounded-[32px] z-40 flex items-center justify-around px-4">
        <button onClick={() => setActiveTab('main')} className={`flex flex-col items-center gap-1 ${activeTab === 'main' ? 'text-[#009FE3] scale-110' : 'text-gray-300'}`}>
          <LayoutDashboard size={24} /><span className="text-[9px] font-black uppercase">{t('nav.main')}</span>
        </button>
        <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1 ${activeTab === 'reports' ? 'text-[#009FE3] scale-110' : 'text-gray-300'}`}>
          <ClipboardList size={24} /><span className="text-[9px] font-black uppercase">{t('nav.reports')}</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-[#009FE3] scale-110' : 'text-gray-300'}`}>
          <UserIcon size={24} /><span className="text-[9px] font-black uppercase">{t('nav.profile')}</span>
        </button>
        {currentUser.role === 'supervisor' && (
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-[#009FE3] scale-110' : 'text-gray-300'}`}>
            <Settings size={24} /><span className="text-[9px] font-black uppercase">{t('nav.settings')}</span>
          </button>
        )}
      </nav>

      <MaterialSelectorModal type={activeMerchantType} stock={stock} onClose={() => setActiveMerchantType(null)} onSubmit={handleConfirmAction} />
      {isInventoryModalOpen && <InventoryManagementModal t={t} stock={stock} onClose={() => setIsInventoryModalOpen(false)} onSubmit={(q: any) => { setStock(stock.map(s => ({...s, quantity: q[s.id]}))); setIsInventoryModalOpen(false); }} />}
      {isEndOfDayModalOpen && <EndOfDayReportModal t={t} stock={stock} dailyUsage={dailyUsage} onClose={() => setIsEndOfDayModalOpen(false)} onSubmit={submitFinalReport} />}
      
      {isBroadcastModalOpen && (
        <BroadcastManagementModal 
          t={t} 
          isSupervisor={currentUser.role === 'supervisor'} 
          broadcast={settings.broadcast}
          onClose={() => setIsBroadcastModalOpen(false)}
          onSubmit={handleBroadcastSubmit}
        />
      )}
    </div>
  );
};

/* Added AgentHistorySection component to display recent user activity */
const AgentHistorySection = ({ t, filterUserId }: { t: any; filterUserId: string }) => {
  const reports = storage.getDailyReports()
    .filter(r => r.userId === filterUserId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><History size={18} /></div>
        <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">{t('agent.historyTitle')}</h3>
      </div>
      <div className="space-y-3">
        {reports.map(report => (
          <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase">{new Date(report.date).toLocaleDateString()}</p>
              <p className="text-xs font-bold text-gray-700">{report.prospections} Pros. / {report.creations} Créas.</p>
            </div>
            <div className="text-right">
               <span className="text-[8px] font-black text-[#009FE3] uppercase bg-white px-2 py-1 rounded-lg border border-gray-100">{report.zone}</span>
            </div>
          </div>
        ))}
        {reports.length === 0 && <p className="text-xs text-center text-gray-400 py-4 italic">Aucun historique disponible.</p>}
      </div>
    </div>
  );
};

/* Added TeamReportsList component to list daily reports */
const TeamReportsList = ({ supervisor, filterUserId, language }: { supervisor: boolean; filterUserId?: string; language: string }) => {
  const [reports, setReports] = React.useState<DailyReport[]>([]);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let all = storage.getDailyReports();
    if (filterUserId) all = all.filter(r => r.userId === filterUserId);
    setReports(all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [filterUserId]);

  const filtered = reports.filter(r => 
    r.userName.toLowerCase().includes(search.toLowerCase()) || 
    r.zone.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="px-2">
        <h2 className="text-xl font-black mb-4">{supervisor ? "Rapports d'Équipe" : "Mes Rapports"}</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher par agent ou zone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none text-sm font-bold shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map(report => (
          <div key={report.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-[#009FE3] rounded-2xl flex items-center justify-center font-black">
                   {report.userName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-sm text-gray-800">{report.userName} {report.lastName}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase">{new Date(report.date).toLocaleDateString()} • {report.zone}</p>
                </div>
              </div>
              <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black">
                {report.creations} Créations
              </div>
            </div>
            
            {report.faitsTerrain && (
              <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
                <p className="text-xs text-gray-600 leading-relaxed italic">"{report.faitsTerrain}"</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-gray-50 rounded-xl">
                <p className="text-[7px] font-black text-gray-400 uppercase">Prosp.</p>
                <p className="text-xs font-black text-gray-800">{report.prospections}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-xl">
                <p className="text-[7px] font-black text-gray-400 uppercase">Visites</p>
                <p className="text-xs font-black text-gray-800">{report.visites}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-xl">
                <p className="text-[7px] font-black text-gray-400 uppercase">Matériel</p>
                <p className="text-xs font-black text-gray-800">{Object.values(report.materielUtilise).reduce((a, b) => a + b, 0)}</p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
              <FileText size={32} />
            </div>
            <p className="text-gray-400 font-bold">Aucun rapport trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* Added ProfileSection component to manage user profile and settings */
const ProfileSection = ({ user, t, language, onLanguageChange }: { user: User; t: any; language: string; onLanguageChange: (l: Language) => void }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-left duration-300 pb-10">
      <div className="flex flex-col items-center py-6">
        <div className="relative mb-4">
          {user.photo ? (
            <img src={user.photo} className="w-24 h-24 rounded-[32px] object-cover shadow-xl border-4 border-white" alt="Profile" />
          ) : (
            <div className="w-24 h-24 bg-[#009FE3] text-white rounded-[32px] flex items-center justify-center text-3xl font-black shadow-xl border-4 border-white">
              {user.firstName.charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full flex items-center justify-center">
             <CheckCircle2 size={14} className="text-white" />
          </div>
        </div>
        <h2 className="text-xl font-black text-gray-800">{user.firstName} {user.lastName}</h2>
        <p className="text-xs font-black text-[#009FE3] uppercase tracking-widest mt-1">{user.role} • {user.zone || 'Global'}</p>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Smartphone size={16} className="text-gray-300" /> {t('profile.coordinates')}
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-[#009FE3] rounded-xl flex items-center justify-center"><Phone size={18} /></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Téléphone</p>
                <p className="text-sm font-bold text-gray-700">{user.phone}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center"><MapPin size={18} /></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Zone</p>
                <p className="text-sm font-bold text-gray-700">{user.zone || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Globe size={16} className="text-gray-300" /> {t('profile.language')}
        </h3>
        <div className="flex gap-4">
          <button 
            onClick={() => onLanguageChange('fr')}
            className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all ${language === 'fr' ? 'bg-[#009FE3] text-white shadow-lg' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
          >
            🇫🇷 FRANÇAIS
          </button>
          <button 
            onClick={() => onLanguageChange('en')}
            className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all ${language === 'en' ? 'bg-[#009FE3] text-white shadow-lg' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
          >
            🇺🇸 ENGLISH
          </button>
        </div>
      </div>

      <button 
        onClick={() => storage.setCurrentUser(null)}
        className="w-full py-5 bg-red-50 text-red-500 font-black rounded-[28px] flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all"
      >
        <LogOut size={20} />
        DÉCONNEXION
      </button>
    </div>
  );
};

const BroadcastManagementModal = ({ t, isSupervisor, broadcast, onClose, onSubmit }: any) => {
  const [msg, setMsg] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-[#009FE3] rounded-2xl flex items-center justify-center">
              <Megaphone size={20} />
            </div>
            <h2 className="text-xl font-black text-gray-800">{isSupervisor ? t('sup.broadcastTitle') : 'Annonce'}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-xl text-gray-400"><X size={20} /></button>
        </div>

        {isSupervisor ? (
          <div className="space-y-6 relative z-10">
            <textarea 
              value={msg} 
              onChange={(e) => setMsg(e.target.value)}
              className="w-full h-40 p-4 bg-gray-50 border border-slate-200 rounded-[28px] outline-none font-bold text-slate-900 placeholder-slate-300 focus:border-[#009FE3] resize-none"
              placeholder={t('sup.broadcastPlaceholder')}
            />
            <button 
              onClick={() => msg.trim() && onSubmit(msg)} 
              className="w-full py-4 bg-[#009FE3] text-white font-black rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Send size={18} /> {t('sup.diffuse')}
            </button>
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            {broadcast ? (
              <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100">
                <p className="text-sm font-bold text-slate-900 leading-relaxed mb-4">"{broadcast.message}"</p>
                <div className="flex items-center justify-between border-t border-blue-100 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#009FE3] rounded-full flex items-center justify-center text-[10px] text-white font-black">
                      {broadcast.author.charAt(0)}
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{broadcast.author}</span>
                  </div>
                  <span className="text-[8px] font-black text-gray-300 uppercase">
                    {new Date(broadcast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-center py-10 text-gray-400 font-bold">{t('agent.noBroadcast')}</p>
            )}
            <button 
              onClick={onClose} 
              className="w-full py-4 bg-gray-800 text-white font-black rounded-2xl active:scale-95 transition-all"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SignupForm = ({ isAgent, t, onSubmit, onBack }: any) => {
  const [photo, setPhoto] = useState('');
  return (
    <form className="w-full max-w-xs space-y-4" onSubmit={(e) => {
      e.preventDefault();
      const f = e.target as any;
      onSubmit({ id: Math.random().toString(36).substr(2, 9), firstName: f.fname.value, lastName: f.lname.value, phone: f.phone.value, role: isAgent ? 'agent' : 'supervisor', zone: isAgent ? f.zone.value : '', photo });
    }}>
      <label className="w-24 h-24 bg-gray-50 rounded-[24px] border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden mx-auto mb-4">
        {photo ? <img src={photo} className="w-full h-full object-cover" /> : <Camera className="text-gray-300" />}
        <input type="file" className="hidden" accept="image/*" onChange={(e) => { const r = new FileReader(); r.onload = () => setPhoto(r.result as string); r.readAsDataURL(e.target.files![0]); }} />
      </label>
      <input name="fname" placeholder={t('auth.fname')} className="w-full px-4 py-4 bg-gray-50 border border-slate-200 rounded-2xl outline-none text-slate-900 placeholder-slate-400 focus:border-[#009FE3]" required />
      <input name="lname" placeholder={t('auth.lname')} className="w-full px-4 py-4 bg-gray-50 border border-slate-200 rounded-2xl outline-none text-slate-900 placeholder-slate-400 focus:border-[#009FE3]" required />
      <input name="phone" placeholder={t('auth.phone')} className="w-full px-4 py-4 bg-gray-50 border border-slate-200 rounded-2xl outline-none text-slate-900 placeholder-slate-400 focus:border-[#009FE3]" required />
      {isAgent && <input name="zone" placeholder={t('auth.zone')} className="w-full px-4 py-4 bg-gray-50 border border-slate-200 rounded-2xl outline-none text-slate-900 placeholder-slate-400 focus:border-[#009FE3]" required />}
      <button className="w-full py-4 bg-[#009FE3] text-white font-bold rounded-2xl">Continuer</button>
      <button type="button" onClick={onBack} className="w-full text-gray-400 font-bold text-sm">Retour</button>
    </form>
  );
};

const InventoryManagementModal = ({ t, stock, onClose, onSubmit }: any) => {
  const [q, setQ] = useState<Record<string, number>>(stock.reduce((a: any, s: any) => ({...a, [s.id]: s.quantity}), {}));
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[40px] p-8">
        <h2 className="text-xl font-black mb-6">{t('agent.inventory')}</h2>
        <div className="space-y-4">
          {stock.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
              <span className="text-xs font-bold uppercase">{s.name}</span>
              <input type="number" value={q[s.id]} onChange={(e) => setQ({...q, [s.id]: parseInt(e.target.value)||0})} className="w-16 p-2 bg-white border border-slate-200 rounded-xl text-center font-black text-[#009FE3] focus:border-[#009FE3] outline-none" />
            </div>
          ))}
        </div>
        <button onClick={() => onSubmit(q)} className="w-full py-4 bg-[#009FE3] text-white font-black rounded-2xl mt-8">Enregistrer</button>
        <button onClick={onClose} className="w-full py-2 text-gray-400 font-bold mt-2">Annuler</button>
      </div>
    </div>
  );
};

const EndOfDayReportModal = ({ t, stock, dailyUsage, onClose, onSubmit }: any) => {
  const [faits, setFaits] = useState('');
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFaits(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[40px] p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-black mb-6">{t('agent.endDay')}</h2>
        <div className="space-y-6">
          <p className="text-xs text-gray-500">Les statistiques de prospection, créations et visites ont été calculées automatiquement à partir de vos actions de la journée.</p>
          <div className="relative">
            <label className="text-[10px] font-black uppercase text-gray-400">Faits Terrain</label>
            <textarea value={faits} onChange={(e) => setFaits(e.target.value)} className="w-full h-32 p-4 bg-gray-50 border border-slate-200 rounded-2xl outline-none text-slate-900 placeholder-slate-300 focus:border-[#009FE3]" placeholder="Racontez votre journée..." />
            <button 
              onClick={startListening} 
              className={`absolute right-4 bottom-4 p-3 rounded-2xl shadow-xl transition-all ${isListening ? 'bg-red-500 text-white scale-110' : 'bg-[#009FE3] text-white'}`}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </div>
        </div>
        <button onClick={() => onSubmit({ faitsTerrain: faits })} className="w-full py-5 bg-[#009FE3] text-white font-black rounded-2xl mt-8 shadow-xl uppercase text-xs">Finaliser le rapport</button>
        <button onClick={onClose} className="w-full py-2 text-gray-400 font-bold mt-2">Annuler</button>
      </div>
    </div>
  );
};

const SupervisorSettingsPanel = ({ t, settings, onUpdate }: any) => {
  const [activeSubTab, setActiveSubTab] = useState<'team' | 'individual'>('team');
  const [teamTargets, setTeamTargets] = useState(settings.teamTargets);
  const [individualTargets, setIndividualTargets] = useState(settings.individualTargets);
  const [isPublishing, setIsPublishing] = useState(false);

  const categories: MerchantType[] = ['Prospection', 'Fixe', 'Ambulant', 'Taxi', 'Moto Taxi'];

  const handleUpdate = (type: 'team' | 'individual', period: PeriodType, cat: string, val: number) => {
    if (type === 'team') {
      setTeamTargets((prev: any) => ({
        ...prev,
        [period]: { ...prev[period], [cat]: val }
      }));
    } else {
      setIndividualTargets((prev: any) => ({
        ...prev,
        [period]: { ...prev[period], [cat]: val }
      }));
    }
  };

  const handlePublish = () => {
    setIsPublishing(true);
    onUpdate({ ...settings, teamTargets, individualTargets });
    setTimeout(() => {
      setIsPublishing(false);
      const feedback = document.createElement('div');
      feedback.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-8 py-4 rounded-[32px] font-black text-sm shadow-2xl z-[100] scale-up-center';
      feedback.innerText = 'OBJECTIFS PUBLIÉS !';
      document.body.appendChild(feedback);
      setTimeout(() => feedback.remove(), 1500);
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-10">
      <h2 className="text-xl font-black px-2">{t('nav.settings')}</h2>
      
      <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
        <button 
          onClick={() => setActiveSubTab('team')}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeSubTab === 'team' ? 'bg-[#009FE3] text-white shadow-md' : 'text-gray-400'}`}
        >
          {t('sup.targets')}
        </button>
        <button 
          onClick={() => setActiveSubTab('individual')}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeSubTab === 'individual' ? 'bg-[#009FE3] text-white shadow-md' : 'text-gray-400'}`}
        >
          {t('agent.progressionTitle')}
        </button>
      </div>

      {(['today', 'week', 'month', 'cycle'] as PeriodType[]).map(p => (
        <div key={p} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-black uppercase text-[#009FE3] mb-4 border-b border-gray-50 pb-2">{t(`periods.${p}`)}</h3>
          <div className="grid grid-cols-2 gap-4">
            {categories.map(c => (
              <div key={c} className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">{c}</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={activeSubTab === 'team' ? teamTargets[p][c] || 0 : individualTargets[p][c] || 0} 
                    onChange={(e) => handleUpdate(activeSubTab, p, c, parseInt(e.target.value) || 0)} 
                    className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:border-[#009FE3] outline-none transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <button 
        onClick={handlePublish} 
        disabled={isPublishing}
        className="w-full py-5 bg-[#009FE3] text-white font-black rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
      >
        {isPublishing ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
        {t('sup.publish')}
      </button>
    </div>
  );
};

export default App;
