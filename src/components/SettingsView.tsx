import React, { useState } from 'react';
import { User, LanguageCode } from '../types';
import { LANGUAGES, TRANSLATIONS } from '../lib/languages';
import { Settings, Save, User as UserIcon, Globe, Navigation } from 'lucide-react';

interface SettingsViewProps {
  user: User | null;
  lang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
  onUpdateUser: (updatedUser: User) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  lang,
  onSelectLang,
  onUpdateUser
}) => {
  const t = TRANSLATIONS[lang];
  const [name, setName] = useState(user?.name || '');
  const [taluk, setTaluk] = useState(user?.taluk || 'Ramnagar');
  const [village, setVillage] = useState(user?.village || 'Ramnagar');
  const [district, setDistrict] = useState(user?.district || 'Karnataka');
  const [farmSize, setFarmSize] = useState(user?.farm_size || '5 Acres');
  const [primaryCrop, setPrimaryCrop] = useState(user?.primary_crop || 'Groundnut & Ragi');
  const [loading, setLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string>('');

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoStatus('📍 Requesting GPS location...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const data = await res.json();
          const addr = data.address || {};
          const detectedVillage = addr.village || addr.town || addr.city || village;
          const detectedTaluk = addr.county || addr.district || taluk;
          const detectedDistrict = addr.state_district || addr.state || district;

          setVillage(detectedVillage);
          setTaluk(detectedTaluk);
          setDistrict(detectedDistrict);
          setGeoStatus(`✅ Location detected: ${detectedVillage}, ${detectedTaluk}`);
        } catch (e) {
          setGeoStatus('📍 GPS coordinates captured.');
        }
      },
      () => {
        setGeoStatus('⚠️ GPS permission denied or disabled.');
      }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/user/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          taluk,
          village,
          district,
          farm_size: farmSize,
          primary_crop: primaryCrop
        })
      });
      const updated = await res.json();
      if (updated.id) {
        onUpdateUser(updated);
        localStorage.setItem('mittiUser', JSON.stringify(updated));
        alert('Profile details saved successfully!');
      }
    } catch (e) {
      alert('Unable to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto pb-24 overflow-y-auto">
      {/* Header */}
      <div className="bg-emerald-800 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-300" />
            <span>{t.settings}</span>
          </h2>
          <p className="text-xs text-emerald-200 mt-0.5">
            Manage your language preferences, profile, and location
          </p>
        </div>
      </div>

      {/* Language Selector */}
      <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-700" />
          <span>Select Application Language</span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => (
            <button
              key={code}
              onClick={() => onSelectLang(code)}
              className={`p-3 rounded-xl border text-center transition font-bold text-xs ${
                lang === code
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {LANGUAGES[code].native} ({LANGUAGES[code].name})
            </button>
          ))}
        </div>
      </div>

      {/* Profile Form */}
      {user ? (
        <form onSubmit={handleSave} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <UserIcon className="w-4 h-4 text-emerald-700" />
            <span>Profile Details</span>
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Taluk</label>
              <input
                type="text"
                value={taluk}
                onChange={(e) => setTaluk(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Village</label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleFetchLocation}
            className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Navigation className="w-4 h-4 text-amber-700" />
            <span>{t.fetchLocation}</span>
          </button>

          {geoStatus && (
            <p className="text-[11px] font-bold text-emerald-800 text-center bg-emerald-50 p-2 rounded-lg">
              {geoStatus}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Farm Land Size</label>
              <input
                type="text"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Primary Crop</label>
              <input
                type="text"
                value={primaryCrop}
                onChange={(e) => setPrimaryCrop(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs"
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>{loading ? 'Saving...' : t.saveSettings}</span>
          </button>
        </form>
      ) : (
        <div className="bg-white p-4 rounded-2xl border border-amber-100 text-center text-xs font-medium text-slate-500">
          Please sign in to manage your profile.
        </div>
      )}
    </div>
  );
};
