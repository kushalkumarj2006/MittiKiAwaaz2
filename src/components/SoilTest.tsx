import React, { useState, useEffect } from 'react';
import { LanguageCode, SoilRecord, User } from '../types';
import { TRANSLATIONS } from '../lib/languages';
import { playSpeech } from '../lib/audioManager';
import { TestTube, Sparkles, Volume2, History } from 'lucide-react';

interface SoilTestProps {
  user: User | null;
  lang: LanguageCode;
}

export const SoilTest: React.FC<SoilTestProps> = ({ user, lang }) => {
  const t = TRANSLATIONS[lang];
  const [ph, setPh] = useState<number>(6.5);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<SoilRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('mitti_soil_records');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  const getPhInfo = (val: number) => {
    if (val < 5.0) return { label: lang === 'kn' ? 'ಅತ್ಯಂತ ಆಮ್ಲೀಯ' : lang === 'hi' ? 'अत्यंत अम्लीय' : 'Strongly Acidic', color: 'bg-red-600 text-white' };
    if (val < 6.2) return { label: lang === 'kn' ? 'ಆಮ್ಲೀಯ' : lang === 'hi' ? 'अम्लीय' : 'Acidic', color: 'bg-amber-600 text-white' };
    if (val <= 7.5) return { label: lang === 'kn' ? 'ಉತ್ತಮ ತಟಸ್ಥ' : lang === 'hi' ? 'उत्तम उदासीन' : 'Optimal Neutral', color: 'bg-emerald-600 text-white' };
    if (val <= 8.5) return { label: lang === 'kn' ? 'ಕ್ಷಾರೀಯ' : lang === 'hi' ? 'क्षारीय' : 'Alkaline', color: 'bg-blue-600 text-white' };
    return { label: lang === 'kn' ? 'ಅತ್ಯಂತ ಕ್ಷಾರೀಯ' : lang === 'hi' ? 'अत्यंत क्षारीय' : 'Strongly Alkaline', color: 'bg-indigo-900 text-white' };
  };

  const phInfo = getPhInfo(ph);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/soil-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ph, userId: user?.id, language: lang })
      });
      const data = await res.json();
      const output = data.response || 'Soil report generated.';
      setResult(output);

      const newRecord: SoilRecord = {
        id: Date.now().toString(),
        ph,
        result: output,
        timestamp: new Date().toLocaleString()
      };
      const updatedHistory = [newRecord, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('mitti_soil_records', JSON.stringify(updatedHistory));

      playSpeech(output, lang === 'kn' ? 'kn-IN' : lang === 'hi' ? 'hi-IN' : 'en-US');
    } catch (e) {
      setResult('Error generating soil analysis.');
    } finally {
      setLoading(false);
    }
  };

  const speakResult = () => {
    if (result) {
      playSpeech(result, lang === 'kn' ? 'kn-IN' : lang === 'hi' ? 'hi-IN' : 'en-US');
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24 overflow-y-auto">
      {/* Title */}
      <div className="bg-emerald-800 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TestTube className="w-5 h-5 text-amber-300" />
            <span>{t.soil}</span>
          </h2>
          <p className="text-xs text-emerald-200 mt-0.5">
            {lang === 'kn' ? 'ಮಣ್ಣಿನ pH ಮತ್ತು ಫಲವತ್ತತೆ ತಪಾಸಣೆ' : lang === 'hi' ? 'अपनी मिट्टी की pH सेहत जाँचें और AI सुधार लें' : 'Check soil pH balance & AI recommendations'}
          </p>
        </div>
      </div>

      {/* pH Slider Card */}
      <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-slate-800">{t.phLabel}</label>
          <span className={`text-xs font-extrabold px-3 py-1 rounded-full shadow-2xs ${phInfo.color}`}>
            pH {ph.toFixed(1)} - {phInfo.label}
          </span>
        </div>

        <input
          type="range"
          min="3.0"
          max="9.5"
          step="0.1"
          value={ph}
          onChange={(e) => setPh(parseFloat(e.target.value))}
          className="w-full accent-emerald-700 h-2.5 bg-slate-200 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[11px] text-slate-500 font-semibold px-1">
          <span>3.0 (Acid)</span>
          <span className="text-emerald-700 font-bold">7.0 (Neutral)</span>
          <span>9.5 (Alkali)</span>
        </div>

        {/* N-P-K Indicators */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl text-center">
            <span className="text-xs font-bold text-red-800 block">N (Nitrogen)</span>
            <span className="text-xs text-red-600 font-medium">
              {ph < 6.0 ? 'Low' : 'Normal'}
            </span>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-center">
            <span className="text-xs font-bold text-amber-800 block">P (Phosphorus)</span>
            <span className="text-xs text-amber-700 font-medium">
              {ph >= 6.0 && ph <= 7.5 ? 'Optimal' : 'Moderate'}
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center">
            <span className="text-xs font-bold text-emerald-800 block">K (Potassium)</span>
            <span className="text-xs text-emerald-700 font-medium">
              {ph > 7.5 ? 'High' : 'Good'}
            </span>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl shadow-xs transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <Sparkles className="w-5 h-5 animate-spin text-amber-300" />
          ) : (
            <TestTube className="w-5 h-5 text-amber-300" />
          )}
          <span>{loading ? t.thinking : t.analyzeSoil}</span>
        </button>
      </div>

      {/* Result Card */}
      {result && (
        <div className="bg-emerald-50 border-2 border-emerald-600 p-4 rounded-2xl shadow-xs space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>✨ Gemini AI Soil Report</span>
            </span>
            <button
              onClick={speakResult}
              className="bg-emerald-700 hover:bg-emerald-800 text-white p-1.5 rounded-full shadow-2xs transition"
              title="Listen audio"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-emerald-950 whitespace-pre-wrap leading-relaxed font-medium">
            {result}
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
          <History className="w-4 h-4 text-amber-600" />
          <span>{t.recentRecords}</span>
        </h3>
        {history.length === 0 ? (
          <p className="text-xs text-slate-400 py-2 text-center">No recent records.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {history.map((rec) => (
              <div key={rec.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-start">
                <div>
                  <span className="font-bold text-emerald-800">pH {rec.ph.toFixed(1)} Report</span>
                  <p className="text-slate-600 line-clamp-2 mt-0.5">{rec.result}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 ml-2">{rec.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
