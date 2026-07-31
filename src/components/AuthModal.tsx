import React, { useState } from 'react';
import { User, LanguageCode } from '../types';
import { TRANSLATIONS } from '../lib/languages';
import { Sprout, Crown, Phone, Lock, X, Navigation, UserPlus, MapPin, Wheat } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  lang: LanguageCode;
  initialRole?: 'farmer' | 'sarpanch';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  lang,
  initialRole = 'farmer'
}) => {
  const t = TRANSLATIONS[lang];
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [roleTab, setRoleTab] = useState<'farmer' | 'sarpanch'>(initialRole);
  
  // Login State
  const [phone, setPhone] = useState('9876543210');
  const [password, setPassword] = useState('1234');
  
  // Register State
  const [regPhone, setRegPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regTaluk, setRegTaluk] = useState('Ramnagar');
  const [regVillage, setRegVillage] = useState('Ramnagar');
  const [regDistrict, setRegDistrict] = useState('Karnataka');
  const [regFarmSize, setRegFarmSize] = useState('5 Acres');
  const [regCrop, setRegCrop] = useState('Groundnut');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gpsStatus, setGpsStatus] = useState<string>('');

  if (!isOpen) return null;

  const requestGpsAndGetCoords = (): Promise<{ lat?: number; lng?: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({});
        return;
      }
      setGpsStatus('📍 GPS Permission requested...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsStatus('✅ GPS coordinates captured');
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn('GPS permission denied or unavailable', err);
          setGpsStatus('⚠️ GPS permission skipped');
          resolve({});
        },
        { timeout: 8000 }
      );
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const coords = await requestGpsAndGetCoords();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: roleTab === 'sarpanch' && phone === '9876543210' ? '9999999999' : phone,
          password: roleTab === 'sarpanch' && password === '1234' ? 'sarpanch123' : password,
          role: roleTab,
          lat: coords.lat,
          lng: coords.lng
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('mittiUser', JSON.stringify(data.user));
        onLoginSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Server connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const coords = await requestGpsAndGetCoords();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: regPhone,
          name: regName,
          password: regPassword,
          role: roleTab,
          taluk: regTaluk,
          village: regVillage,
          district: regDistrict,
          farm_size: regFarmSize,
          primary_crop: regCrop,
          lat: coords.lat,
          lng: coords.lng
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('mittiUser', JSON.stringify(data.user));
        onLoginSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Server error during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-emerald-600 relative my-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo & Header */}
        <div className="text-center space-y-1 mb-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-800 to-emerald-600 text-amber-300 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-md border-2 border-amber-300">
            🌾
          </div>
          <h2 className="text-xl font-black text-emerald-950">{t.title}</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Krishi Sakhi Agriculture Portal
          </p>
        </div>

        {/* Role Switcher (Shown only in login mode) */}
        {mode === 'login' ? (
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-3 text-xs font-bold">
            <button
              onClick={() => { setRoleTab('farmer'); setError(''); }}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                roleTab === 'farmer'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sprout className="w-4 h-4 text-amber-300" />
              <span>{t.farmerLogin}</span>
            </button>
            <button
              onClick={() => { setRoleTab('sarpanch'); setError(''); }}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                roleTab === 'sarpanch'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>{t.sarpanchLogin}</span>
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2 rounded-xl font-bold text-center mb-3 flex items-center justify-center gap-1.5">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>Farmer Registration Only (Sarpanch creation disabled)</span>
          </div>
        )}

        {/* Mode Toggle (Login vs Register) */}
        <div className="flex justify-center border-b border-slate-200 mb-4 text-xs font-bold text-slate-600 gap-6">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`pb-2 border-b-2 transition ${
              mode === 'login' ? 'border-emerald-700 text-emerald-800 font-black' : 'border-transparent'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setRoleTab('farmer'); setError(''); }}
            className={`pb-2 border-b-2 transition ${
              mode === 'register' ? 'border-emerald-700 text-emerald-800 font-black' : 'border-transparent'
            }`}
          >
            Register New Farmer
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 text-xs p-2.5 rounded-xl font-bold text-center mb-3">
            {error}
          </div>
        )}

        {gpsStatus && (
          <div className="bg-blue-50 text-blue-800 border border-blue-200 text-[11px] p-2 rounded-xl text-center mb-3 font-semibold">
            {gpsStatus}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">📱 Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile"
                  required
                  className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">🔐 Password / PIN</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password or PIN"
                  required
                  className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-black py-3 rounded-xl shadow-md transition text-xs uppercase tracking-wider ${
                roleTab === 'farmer' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {loading ? 'Logging in...' : `🌱 ${roleTab === 'farmer' ? 'Farmer' : 'Sarpanch'} Login`}
            </button>

            <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl text-[11px] text-amber-900 font-medium text-center">
              💡 Demo {roleTab === 'farmer' ? 'Farmer' : 'Sarpanch'}: <strong>{roleTab === 'farmer' ? '9876543210' : '9999999999'}</strong> / Pwd: <strong>{roleTab === 'farmer' ? '1234' : 'sarpanch123'}</strong>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">📱 Mobile Number</label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="10-digit phone"
                required
                className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">👤 Full Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Your Name"
                required
                className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">🔑 Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Create Password"
                required
                className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Taluk</label>
                <input
                  type="text"
                  value={regTaluk}
                  onChange={(e) => setRegTaluk(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Village</label>
                <input
                  type="text"
                  value={regVillage}
                  onChange={(e) => setRegVillage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 rounded-xl shadow-md transition text-xs uppercase tracking-wider"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
