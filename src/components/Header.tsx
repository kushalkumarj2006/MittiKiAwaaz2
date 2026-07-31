import React from 'react';
import { User, LanguageCode } from '../types';
import { TRANSLATIONS, LANGUAGES } from '../lib/languages';
import { Sprout, LogOut, Settings, Crown, User as UserIcon, ShoppingBag, Globe } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  lang: LanguageCode;
  activeViewLink: 'farmer' | 'sarpanch' | 'public';
  onSelectViewLink: (link: 'farmer' | 'sarpanch' | 'public') => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSelectLang: (lang: LanguageCode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  lang,
  activeViewLink,
  onSelectViewLink,
  onOpenSettings,
  onOpenAuth,
  onLogout,
  onSelectLang
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-50">
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-emerald-700/60">
        {/* Brand */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectViewLink('farmer')}>
          <div className="bg-emerald-700 p-2 rounded-2xl shadow-inner flex items-center justify-center border border-amber-300/40">
            <Sprout className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg tracking-wide leading-none text-white">{t.title}</h1>
            <p className="text-[10px] text-emerald-200 tracking-wider uppercase font-semibold">Krishi Sakhi Portal</p>
          </div>
        </div>

        {/* Language Switcher & User Actions */}
        <div className="flex items-center gap-2">
          {/* Lang Selector */}
          <div className="flex bg-emerald-900/80 p-0.5 rounded-xl border border-emerald-700">
            {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => (
              <button
                key={code}
                onClick={() => onSelectLang(code)}
                className={`px-2 py-1 rounded-lg text-[11px] font-black uppercase transition ${
                  lang === code ? 'bg-amber-400 text-emerald-950' : 'text-emerald-200 hover:text-white'
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          {user ? (
            <div className="flex items-center gap-1.5">
              <div className="hidden sm:flex flex-col text-right mr-1">
                <span className="text-xs font-bold leading-tight">{user.name}</span>
                <span className="text-[10px] text-amber-200">{user.taluk}</span>
              </div>
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-xl hover:bg-emerald-700 transition text-emerald-100"
                title={t.settings}
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl hover:bg-red-700 text-red-200 hover:text-white transition"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-amber-400 hover:bg-amber-500 text-emerald-950 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition"
            >
              <UserIcon className="w-4 h-4" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
