import React, { useState, useEffect } from 'react';
import { User, WeatherData, ForecastItem, LanguageCode } from '../types';
import { TRANSLATIONS } from '../lib/languages';
import { playSpeech } from '../lib/audioManager';
import { CloudSun, Droplets, Wind, Sparkles, Calendar, Volume2, RefreshCw } from 'lucide-react';

interface WeatherAdvisoryProps {
  user: User | null;
  lang: LanguageCode;
}

export const WeatherAdvisory: React.FC<WeatherAdvisoryProps> = ({ user, lang }) => {
  const t = TRANSLATIONS[lang];
  const [current, setCurrent] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const taluk = user?.taluk || 'Ramnagar';

  useEffect(() => {
    loadWeather();
  }, [taluk, lang]);

  const loadWeather = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weather?taluk=${encodeURIComponent(taluk)}&language=${lang}`);
      const data = await res.json();
      if (data.weather) setCurrent(data.weather);
      if (data.forecast) setForecast(data.forecast);
      if (data.analysis) setAnalysis(data.analysis);
    } catch (err) {
      console.error('Failed to load weather', err);
    } finally {
      setLoading(false);
    }
  };

  const speakAdvisory = () => {
    if (analysis) {
      playSpeech(analysis, lang === 'kn' ? 'kn-IN' : lang === 'hi' ? 'hi-IN' : 'en-US');
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24 overflow-y-auto">
      {/* Header */}
      <div className="bg-emerald-800 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-amber-300" />
            <span>{t.weather}</span>
          </h2>
          <p className="text-xs text-emerald-200 mt-0.5">
            {taluk} Taluk • Weather Forecast & AI Advisory
          </p>
        </div>
        <button
          onClick={loadWeather}
          disabled={loading}
          className="p-2 rounded-full bg-emerald-700 hover:bg-emerald-600 text-amber-300 transition"
          title="Refresh weather"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-2xl text-center space-y-2 border border-amber-100 shadow-xs font-bold text-xs text-slate-500">
          <Sparkles className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p>Loading weather & AI agricultural forecast...</p>
        </div>
      ) : (
        <>
          {/* Current Weather Card */}
          <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white p-5 rounded-2xl shadow-md space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-3xl font-extrabold block">
                  {current?.temperature?.max?.value || 31}°C
                </span>
                <span className="text-xs text-emerald-200 font-medium">
                  Min {current?.temperature?.min?.value || 22}°C • {forecast[0]?.description || 'Partly Cloudy'}
                </span>
              </div>
              <div className="text-4xl">🌤️</div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-600/60">
              <div className="flex items-center gap-2 bg-emerald-800/50 p-2 rounded-xl text-xs font-bold">
                <Droplets className="w-4 h-4 text-cyan-300" />
                <span>Humidity: {current?.humidity?.morning || 76}%</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-800/50 p-2 rounded-xl text-xs font-bold">
                <Wind className="w-4 h-4 text-amber-300" />
                <span>Wind: {current?.wind?.speed || 12} km/h</span>
              </div>
            </div>
          </div>

          {/* AI Advisory */}
          {analysis && (
            <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-2xl shadow-2xs space-y-2">
              <div className="flex justify-between items-center border-b border-amber-200 pb-1.5">
                <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>🌾 Krishi Sakhi Weather Advisory (Gemini AI)</span>
                </span>
                <button
                  onClick={speakAdvisory}
                  className="bg-amber-600 hover:bg-amber-700 text-white p-1 rounded-full shadow-2xs transition"
                  title="Listen advice"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                {analysis}
              </div>
            </div>
          )}

          {/* Forecast List */}
          <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>5-Day Forecast</span>
            </h3>
            <div className="space-y-2">
              {forecast.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl text-xs border border-slate-200 font-medium"
                >
                  <span className="font-bold text-slate-800 w-24">{item.date}</span>
                  <span className="text-slate-600 flex-1 px-2 truncate">{item.description}</span>
                  <span className="font-extrabold text-emerald-800 shrink-0">
                    {item.max_temp}°C / {item.min_temp}°C
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
