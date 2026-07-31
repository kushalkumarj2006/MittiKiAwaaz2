import React, { useState, useEffect } from 'react';
import { User, LanguageCode } from './types';
import { TRANSLATIONS } from './lib/languages';
import { subscribeAudioState, stopAudio } from './lib/audioManager';
import { Header } from './components/Header';
import { VoiceSakhi } from './components/VoiceSakhi';
import { SoilTest } from './components/SoilTest';
import { DisasterAlerts } from './components/DisasterAlerts';
import { CommunityChat } from './components/CommunityChat';
import { CropMarketplace } from './components/CropMarketplace';
import { WeatherAdvisory } from './components/WeatherAdvisory';
import { SarpanchDashboard } from './components/SarpanchDashboard';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { Mic, TestTube, AlertTriangle, MessageSquare, ShoppingBag, CloudSun, VolumeX, Crown } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<LanguageCode>('hi');
  const [portalLink, setPortalLink] = useState<'farmer' | 'sarpanch' | 'public'>('farmer');
  const [activeTab, setActiveTab] = useState<string>('voice');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  const getPortalFromPath = (path: string): 'farmer' | 'sarpanch' | 'public' => {
    const p = path.toLowerCase();
    if (p.startsWith('/sarpanch')) return 'sarpanch';
    if (p.startsWith('/marketplace') || p.startsWith('/public') || p.startsWith('/market')) return 'public';
    return 'farmer';
  };

  const getPathFromPortal = (portal: 'farmer' | 'sarpanch' | 'public'): string => {
    if (portal === 'sarpanch') return '/sarpanch';
    if (portal === 'public') return '/marketplace';
    return '/krishi-sakhi';
  };

  useEffect(() => {
    // 1. Subscribe to audio playing state for floating red stop button
    const unsubscribe = subscribeAudioState((playing) => {
      setIsAudioPlaying(playing);
    });

    // 2. Initialize portal based on current URL endpoint path
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '') {
      const pathPortal = getPortalFromPath(currentPath);
      setPortalLink(pathPortal);
    } else {
      const savedPortal = localStorage.getItem('mittiPortalLink') as 'farmer' | 'sarpanch' | 'public';
      if (savedPortal) {
        setPortalLink(savedPortal);
      }
    }

    // 3. Listen to browser back/forward buttons (popstate)
    const handlePopState = () => {
      const pathPortal = getPortalFromPath(window.location.pathname);
      setPortalLink(pathPortal);
    };
    window.addEventListener('popstate', handlePopState);

    // 4. Restore state from localStorage
    const savedLang = localStorage.getItem('mittiLang') as LanguageCode;
    if (savedLang && ['kn', 'en', 'hi'].includes(savedLang)) {
      setLang(savedLang);
    }

    const savedTab = localStorage.getItem('mittiActiveTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }

    const savedUser = localStorage.getItem('mittiUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(null);
        setShowAuthModal(true);
      }
    } else {
      // Per user instruction: "when user first visit the site, make it start from login page."
      setShowAuthModal(true);
    }

    return () => {
      unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Stop audio whenever changing page / tab / language / portal
  const changePortalLink = (link: 'farmer' | 'sarpanch' | 'public') => {
    stopAudio();
    setPortalLink(link);
    const targetPath = getPathFromPortal(link);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    localStorage.setItem('mittiPortalLink', link);
  };

  const changeTab = (tab: string) => {
    stopAudio();
    setActiveTab(tab);
    localStorage.setItem('mittiActiveTab', tab);
  };

  const changeLang = (newLang: LanguageCode) => {
    stopAudio();
    setLang(newLang);
    localStorage.setItem('mittiLang', newLang);
  };

  const handleLogout = () => {
    stopAudio();
    setUser(null);
    localStorage.removeItem('mittiUser');
    setShowAuthModal(true);
  };

  const farmerNavItems = [
    { id: 'voice', label: TRANSLATIONS[lang].krishiSakhi, icon: Mic },
    { id: 'soil', label: TRANSLATIONS[lang].soil, icon: TestTube },
    { id: 'disaster', label: TRANSLATIONS[lang].disaster, icon: AlertTriangle },
    { id: 'community', label: TRANSLATIONS[lang].community, icon: MessageSquare },
    { id: 'market', label: TRANSLATIONS[lang].mySales, icon: ShoppingBag },
    { id: 'weather', label: TRANSLATIONS[lang].weather, icon: CloudSun }
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-amber-50/20 text-slate-900 overflow-hidden font-sans select-none relative">
      {/* Top Header */}
      <Header
        user={user}
        lang={lang}
        activeViewLink={portalLink}
        onSelectViewLink={changePortalLink}
        onOpenSettings={() => changeTab('settings')}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onSelectLang={changeLang}
      />

      {/* Main Container Views */}
      <main className="flex-1 overflow-hidden relative">
        {/* Link 1: Farmer / User Portal */}
        {portalLink === 'farmer' && (
          <>
            {activeTab === 'voice' && (
              <VoiceSakhi
                lang={lang}
                onSelectLang={changeLang}
                onNavigateTab={(t) => changeTab(t)}
              />
            )}
            {activeTab === 'soil' && <SoilTest user={user} lang={lang} />}
            {activeTab === 'disaster' && <DisasterAlerts lang={lang} />}
            {activeTab === 'community' && <CommunityChat user={user} lang={lang} />}
            {activeTab === 'market' && <CropMarketplace user={user} lang={lang} />}
            {activeTab === 'weather' && <WeatherAdvisory user={user} lang={lang} />}
            {activeTab === 'settings' && (
              <SettingsView
                user={user}
                lang={lang}
                onSelectLang={changeLang}
                onUpdateUser={(u) => setUser(u)}
              />
            )}
          </>
        )}

        {/* Link 2: Sarpanch Portal */}
        {portalLink === 'sarpanch' && (
          <SarpanchDashboard
            user={user}
            lang={lang}
            onOpenAuth={() => setShowAuthModal(true)}
            onLoginSuccess={(u) => setUser(u)}
          />
        )}

        {/* Link 3: Public Marketplace View */}
        {portalLink === 'public' && (
          <CropMarketplace
            user={user}
            lang={lang}
            isPublicView={true}
          />
        )}
      </main>

      {/* Bottom Floating Audio Stop Button when Audio is Playing */}
      {isAudioPlaying && (
        <button
          onClick={() => stopAudio()}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs border-2 border-white animate-bounce cursor-pointer transition"
        >
          <VolumeX className="w-4 h-4 text-amber-300" />
          <span>{TRANSLATIONS[lang].stopAudio || 'Stop Audio'}</span>
        </button>
      )}

      {/* Bottom Navigation Bar for Farmer View */}
      {portalLink === 'farmer' && (
        <nav className="bg-white border-t border-amber-200/80 px-1 py-1.5 flex justify-around items-center sticky bottom-0 z-40 shadow-lg">
          {farmerNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => changeTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-800 font-extrabold bg-emerald-50 scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700' : ''}`} />
                <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={(u) => {
          setUser(u);
          setShowAuthModal(false);
          if (u.role === 'sarpanch') {
            setPortalLink('sarpanch');
          }
        }}
        lang={lang}
        initialRole={portalLink === 'sarpanch' ? 'sarpanch' : 'farmer'}
      />
    </div>
  );
}
