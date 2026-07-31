import React, { useState, useEffect } from 'react';
import { User, LanguageCode } from '../types';
import { TRANSLATIONS } from '../lib/languages';
import { Crown, Users, Award, Shield, Search, FileSpreadsheet, Lock, Phone, AlertCircle } from 'lucide-react';

interface SarpanchDashboardProps {
  user: User | null;
  lang: LanguageCode;
  onOpenAuth?: () => void;
  onLoginSuccess?: (user: User) => void;
}

export const SarpanchDashboard: React.FC<SarpanchDashboardProps> = ({ user, lang, onLoginSuccess }) => {
  const t = TRANSLATIONS[lang];
  const [farmers, setFarmers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Dedicated Sarpanch Login State
  const [phone, setPhone] = useState('9999999999');
  const [password, setPassword] = useState('sarpanch123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');

  const taluk = user?.taluk || 'Ramnagar';

  useEffect(() => {
    if (user?.role === 'sarpanch') {
      loadFarmers();
    } else {
      setLoading(false);
    }
  }, [user, taluk]);

  const loadFarmers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sarpanch/farmers?taluk=${encodeURIComponent(taluk)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setFarmers(data);
      }
    } catch (err) {
      console.error('Failed to load farmers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSarpanchLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          password,
          role: 'sarpanch'
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('mittiUser', JSON.stringify(data.user));
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        } else {
          window.location.reload();
        }
      } else {
        setError(data.error || 'Invalid Sarpanch credentials');
      }
    } catch (err) {
      setError('Server connection error');
    } finally {
      setLoginLoading(false);
    }
  };

  if (!user || user.role !== 'sarpanch') {
    return (
      <div className="p-4 max-w-md mx-auto my-8 space-y-4">
        <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-amber-400 space-y-4">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-600 to-amber-800 text-amber-200 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-md border-2 border-amber-300">
              👑
            </div>
            <h2 className="text-xl font-black text-slate-900">Sarpanch Portal Login</h2>
            <p className="text-xs text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200 font-bold">
              Gram Panchayat Official Administration Endpoint (/sarpanch)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 text-xs p-2.5 rounded-xl font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSarpanchLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">📱 Sarpanch Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile"
                  required
                  className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-amber-600"
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
                  className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-amber-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3 rounded-xl shadow-md transition text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-200" />
              <span>{loginLoading ? 'Authenticating...' : 'Sign In as Sarpanch'}</span>
            </button>
          </form>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1 text-slate-600 text-[11px]">
            <div className="flex items-center gap-1 font-bold text-amber-900">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Restricted Panchayat Login</span>
            </div>
            <p className="leading-snug">
              Sarpanch credentials are strictly provisioned by Gram Panchayat officers. Creating or registering Sarpanch accounts publicly is not permitted.
            </p>
            <p className="pt-1 text-[10px] text-slate-500 font-mono">
              Default Demo: <strong>9999999999</strong> / Password: <strong>sarpanch123</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredFarmers = farmers.filter(
    (f) =>
      (f.name && f.name.toLowerCase().includes(search.toLowerCase())) ||
      (f.phone && f.phone.includes(search)) ||
      (f.village && f.village.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-200">Gram Panchayat Portal</span>
          <h2 className="text-xl font-black flex items-center gap-2 mt-0.5">
            <Crown className="w-6 h-6 text-amber-200" />
            <span>{user.name} - {taluk} Taluk</span>
          </h2>
          <p className="text-xs text-amber-100 mt-1 font-medium">
            Manage village farmers, land records, and PM-KISAN scheme eligibility
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs text-center space-y-1">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-1">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{farmers.length}</span>
          <span className="text-xs font-bold text-slate-500 uppercase">Registered Farmers</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs text-center space-y-1">
          <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-1">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">82%</span>
          <span className="text-xs font-bold text-slate-500 uppercase">Climate Resilience Index</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs text-center space-y-1">
          <div className="w-10 h-10 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mx-auto mb-1">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">PM-KISAN</span>
          <span className="text-xs font-bold text-slate-500 uppercase">100% Eligible</span>
        </div>
      </div>

      {/* Farmers Directory */}
      <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <span>Panchayat Farmers Directory ({filteredFarmers.length})</span>
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, village..."
              className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-1.5 rounded-xl text-xs font-medium focus:outline-emerald-600"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 text-center py-6 font-medium">Loading farmer records...</p>
        ) : filteredFarmers.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6 font-medium">No farmer records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-800 text-white rounded-xl">
                <tr>
                  <th className="p-2.5 font-bold rounded-l-xl">Farmer Name</th>
                  <th className="p-2.5 font-bold">Phone Number</th>
                  <th className="p-2.5 font-bold">Land Size</th>
                  <th className="p-2.5 font-bold">Primary Crop</th>
                  <th className="p-2.5 font-bold">Village</th>
                  <th className="p-2.5 font-bold rounded-r-xl">Schemes Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFarmers.map((f) => (
                  <tr key={f.id} className="hover:bg-amber-50/50 transition">
                    <td className="p-2.5 font-bold text-slate-900">{f.name}</td>
                    <td className="p-2.5 text-slate-700">{f.phone}</td>
                    <td className="p-2.5 text-emerald-800 font-semibold">{f.farm_size || '5 Acres'}</td>
                    <td className="p-2.5 text-slate-800">{f.primary_crop || 'Groundnut'}</td>
                    <td className="p-2.5 text-slate-600">{f.village || taluk}</td>
                    <td className="p-2.5">
                      <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full mr-1">
                        PM-KISAN
                      </span>
                      <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Soil Card
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
