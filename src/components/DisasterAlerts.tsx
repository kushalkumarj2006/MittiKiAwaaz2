import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import { TRANSLATIONS } from '../lib/languages';
import { playSpeech, stopAudio } from '../lib/audioManager';
import { ShieldAlert, Volume2, CheckCircle2, ShieldCheck, Home, Wheat, X } from 'lucide-react';

interface DisasterAlertsProps {
  lang: LanguageCode;
}

export const DisasterAlerts: React.FC<DisasterAlertsProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [acks, setAcks] = useState<Record<string, boolean>>({});
  const [activeChecklist, setActiveChecklist] = useState<string | null>(null);

  const alerts = [
    {
      id: 'flood_alert',
      severity: 'critical',
      title: lang === 'kn' ? '🚨 ಮಳೆ ಹಾಗೂ ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ' : lang === 'hi' ? '🚨 IMD बाढ़ व भारी बारिश चेतावनी' : '🚨 IMD Critical Flood & Heavy Rain Warning',
      badge: 'Critical',
      message: lang === 'kn'
        ? 'ಐಎಂಡಿ ಮುನ್ಸೂಚನೆ: ಮುಂದಿನ 48 ಗಂಟೆಗಳಲ್ಲಿ ಭಾರಿ ಮಳೆ ಸಾಧ್ಯತೆ. ನದಿ ಪಾತ್ರದ ನಿವಾಸಿಗಳು ಮತ್ತು ಕೃಷಿ ಪಂಪ್ ಸೆಟ್‌ಗಳನ್ನು ಎತ್ತರದ ಪ್ರದೇಶಕ್ಕೆ ಸ್ಥಳಾಂತರಿಸಿ.'
        : lang === 'hi'
        ? 'IMD की चेतावनी: अगले 48 घंटों में भारी बारिश का अनुमान। कृषि पंप सुरक्षित स्थान पर ले जाएं और पशुओं को ऊंचे स्थान पर बांधें।'
        : 'IMD Alert: Heavy rainfall predicted in next 48 hrs. Move agricultural pumps to higher ground and secure livestock.'
    },
    {
      id: 'heatwave_alert',
      severity: 'warning',
      title: lang === 'kn' ? '🌡️ ತೀವ್ರ ತಾಪಮಾನ ಎಚ್ಚರಿಕೆ' : lang === 'hi' ? '🌡️ तीव्र लू (Heatwave) अलर्ट' : '🌡️ Severe Heatwave Alert',
      badge: 'Warning',
      message: lang === 'kn'
        ? 'ಈ ವಾರ ತಾಪಮಾನ 42°C ಗಿಂತ ಹೆಚ್ಚಾಗುವ ಸಾಧ್ಯತೆ ಇದೆ. ಬೆಳೆಗಳಿಗೆ ಸಂಜೆ ವೇಳೆಯಲ್ಲಿ ನೀರಾವರಿ ಒದಗಿಸಿ.'
        : lang === 'hi'
        ? 'इस सप्ताह तापमान 42°C से ऊपर जाने की संभावना। शाम के समय खड़ी फसलों में हल्की सिंचाई करें।'
        : 'Temperatures expected above 42°C. Irrigate standing crops during early evening hours.'
    },
    {
      id: 'advisory_alert',
      severity: 'info',
      title: lang === 'kn' ? 'ℹ️ ಬೆಳೆ ಕೀಟ ನಿಯಂತ್ರಣ ಸಲಹೆ' : lang === 'hi' ? 'ℹ️ सामान्य मौसम व कीट चेतावनी' : 'ℹ️ General Pest & Disease Notice',
      badge: lang === 'kn' ? 'ಮಾಹಿತಿ' : 'Info',
      message: lang === 'kn'
        ? 'ಆರ್ದ್ರತೆ ಹೆಚ್ಚಳದಿಂದ ಬೆಳೆಗಳಲ್ಲಿ ಕೀಟ ಬಾಧೆ ಉಂಟಾಗಬಹುದು. ಬೇವು ಆಧಾರಿತ ಜೈವಿಕ ಕೀಟನಾಶಕ ಸಿಂಪಡಿಸಿ.'
        : lang === 'hi'
        ? 'आर्द्रता बढ़ने से मूंगफली में टिक्का रोग हो सकता है। नीम आधारित जैविक कीटनाशक का छिड़काव करें।'
        : 'Increased humidity may trigger crop leaf spot. Apply neem-based bio-pesticides.'
    }
  ];

  const checklists: Record<string, { title: string; items: string[] }> = {
    livestock: {
      title: lang === 'kn' ? '🐮 ಜಾನುವಾರು ರಕ್ಷಣೆ ಮಾರ್ಗಸೂಚಿ' : lang === 'hi' ? '🐮 मवेशी सुरक्षा चेकलिस्ट' : '🐮 Livestock Safety Checklist',
      items: [
        lang === 'kn' ? '1. ದನ ಕರುಗಳನ್ನು ತಗ್ಗು ಪ್ರದೇಶದಿಂದ ಎತ್ತರದ ಶೆಡ್‌ಗೆ ಸ್ಥಳಾಂತರಿಸಿ.' : '1. Shift livestock to higher ground.',
        lang === 'kn' ? '2. ಶುದ್ಧ ಕುಡಿಯುವ ನೀರು ಮತ್ತು ಒಣ ಮೇವು ಸಂಗ್ರಹಿಸಿಡಿ.' : '2. Store dry fodder and safe drinking water for 5 days.',
        lang === 'kn' ? '3. ವಿದ್ಯುತ್ ಕಂಬಗಳಿಂದ ಜಾನುವಾರುಗಳನ್ನು ದೂರವಿಡಿ.' : '3. Keep animals away from loose electric poles.'
      ]
    },
    crops: {
      title: lang === 'kn' ? '🌾 ಬೆಳೆ ರಕ್ಷಣೆ ಮಾರ್ಗಸೂಚಿ' : lang === 'hi' ? '🌾 फसल सुरक्षा चेकलिस्ट' : '🌾 Crop Protection Checklist',
      items: [
        lang === 'kn' ? '1. ಜಮೀನಿನಿಂದ ಹೆಚ್ಚುವರಿ ನೀರು ಹರಿದುಹೋಗಲು ಚರಂಡಿ ಸ್ವಚ್ಛಗೊಳಿಸಿ.' : '1. Clear drainage channels to drain surplus rain water.',
        lang === 'kn' ? '2. ಬೆಳೆದ ಬೆಳೆಯನ್ನು ತಕ್ಷಣ ಕೊಯ್ಲು ಮಾಡಿ ಸುರಕ್ಷಿತ ದಾಸ್ತಾನಿನಲ್ಲಿಡಿ.' : '2. Harvest matured crops immediately and store safely.',
        lang === 'kn' ? '3. ಗಾಳಿ ಮಳೆಯ ಸಮಯದಲ್ಲಿ ರಾಸಾಯನಿಕ ಸಿಂಪಡಣೆ ಮಾಡಬೇಡಿ.' : '3. Postpone chemical spraying during strong winds.'
      ]
    },
    evacuation: {
      title: lang === 'kn' ? '🏠 ತುರ್ತು ಸ್ಥಳಾಂತರ ಮಾರ್ಗಸೂಚಿ' : lang === 'hi' ? '🏠 आपातकालीन निकासी चेकलिस्ट' : '🏠 Emergency Evacuation Checklist',
      items: [
        lang === 'kn' ? '1. ಭೂಮಿ ದಾಖಲೆಗಳು ಮತ್ತು ಆಧಾರ್ ಕಾರ್ಡ್ ವಾಟರ್‌ಪ್ರೂಫ್ ಬ್ಯಾಗ್‌ನಲ್ಲಿಡಿ.' : '1. Keep land documents & Aadhaar in waterproof bag.',
        lang === 'kn' ? '2. ಮೊಬೈಲ್ ಫೋನ್ ಪೂರ್ಣ ಚಾರ್ಜ್ ಮಾಡಿಡಿ.' : '2. Keep mobile phone and power bank fully charged.',
        lang === 'kn' ? '3. ಗ್ರಾಮ ಪಂಚಾಯತಿ ತುರ್ತು ಸಂಖ್ಯೆ ಉಳಿಸಿಕೊಳ್ಳಿ.' : '3. Keep Gram Panchayat emergency contacts handy.'
      ]
    }
  };

  const toggleAck = (id: string) => {
    setAcks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const speakAlert = (text: string) => {
    playSpeech(text, lang === 'kn' ? 'kn-IN' : lang === 'hi' ? 'hi-IN' : 'en-US');
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24 overflow-y-auto">
      <div className="bg-red-800 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-300" />
            <span>{t.disaster}</span>
          </h2>
          <p className="text-xs text-red-200 mt-0.5">
            Real-time IMD Weather & Agricultural Safety Alerts
          </p>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {alerts.map((al) => {
          const isAcked = acks[al.id];
          return (
            <div
              key={al.id}
              className={`p-4 rounded-2xl border-l-4 shadow-2xs transition ${
                al.severity === 'critical'
                  ? 'bg-red-50/90 border-red-600 border border-red-200'
                  : al.severity === 'warning'
                  ? 'bg-amber-50/90 border-amber-500 border border-amber-200'
                  : 'bg-blue-50/90 border-blue-500 border border-blue-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-sm text-slate-900">{al.title}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-red-600 text-white">
                  {al.badge}
                </span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium mb-3">
                {al.message}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleAck(al.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                    isAcked
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAcked ? 'Acknowledged' : 'Acknowledge'}</span>
                </button>
                <button
                  onClick={() => speakAlert(al.message)}
                  className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                >
                  <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Listen</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Checklists Grid */}
      <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>{t.checklists}</span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveChecklist('livestock')}
            className="bg-amber-50 hover:bg-amber-100 border border-amber-200 p-3 rounded-xl flex flex-col items-center gap-1 text-center transition"
          >
            <span className="text-2xl">🐮</span>
            <span className="text-xs font-bold text-slate-800">Livestock</span>
          </button>
          <button
            onClick={() => setActiveChecklist('crops')}
            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-3 rounded-xl flex flex-col items-center gap-1 text-center transition"
          >
            <Wheat className="w-6 h-6 text-emerald-800" />
            <span className="text-xs font-bold text-slate-800">Crops</span>
          </button>
          <button
            onClick={() => setActiveChecklist('evacuation')}
            className="bg-blue-50 hover:bg-blue-100 border border-blue-200 p-3 rounded-xl flex flex-col items-center gap-1 text-center transition"
          >
            <Home className="w-6 h-6 text-blue-800" />
            <span className="text-xs font-bold text-slate-800">Evacuation</span>
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {activeChecklist && checklists[activeChecklist] && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">
                {checklists[activeChecklist].title}
              </h3>
              <button
                onClick={() => setActiveChecklist(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="space-y-2.5">
              {checklists[activeChecklist].items.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                const fullText = checklists[activeChecklist].items.join('. ');
                speakAlert(fullText);
              }}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs transition"
            >
              <Volume2 className="w-4 h-4 text-amber-300" />
              <span>Listen Full Guide</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
