import React, { useState, useEffect, useRef } from 'react';
import { LanguageCode, ChatMessage } from '../types';
import { LANGUAGES, TRANSLATIONS } from '../lib/languages';
import { playSpeech, stopAudio } from '../lib/audioManager';
import { Mic, MicOff, Send, Volume2, VolumeX, Sparkles, TestTube, CloudSun, FileText, Gift, IndianRupee, Leaf } from 'lucide-react';

interface VoiceSakhiProps {
  lang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
  onNavigateTab?: (tab: string) => void;
}

export const VoiceSakhi: React.FC<VoiceSakhiProps> = ({ lang, onSelectLang, onNavigateTab }) => {
  const t = TRANSLATIONS[lang];
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<'online' | 'listening' | 'speaking' | 'thinking'>('online');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize or update welcome greeting when language changes
  useEffect(() => {
    const welcomeMsg: ChatMessage = {
      id: 'welcome_' + lang,
      sender: 'ai',
      text: t.greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (messages.length === 0 || messages[0].id.startsWith('welcome_')) {
      setMessages([welcomeMsg]);
    }
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const speakText = (text: string) => {
    setStatus('speaking');
    playSpeech(text, LANGUAGES[lang].code, () => {
      setStatus('online');
    });
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    stopAudio();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setStatus('thinking');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, language: lang })
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.response || 'Sorry, I am having trouble responding right now.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
      setStatus('online');
      speakText(aiMsg.text);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: lang === 'kn' ? '🙏 ಕ್ಷಮಿಸಿ, ಸಂಪರ್ಕ ದೋಷ.' : lang === 'hi' ? '🙏 क्षमा करें, नेटवर्क समस्या।' : '🙏 Network error. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
      setStatus('online');
    }
  };

  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setStatus('online');
    } else {
      stopAudio();
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = LANGUAGES[lang].code;

      rec.onstart = () => {
        setIsListening(true);
        setStatus('listening');
      };

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
      };

      rec.onerror = () => {
        setIsListening(false);
        setStatus('online');
      };

      rec.onend = () => {
        setIsListening(false);
        setStatus('online');
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  const shortcuts = [
    { label: t.soil, icon: TestTube, action: () => onNavigateTab?.('soil') },
    { label: t.weather, icon: CloudSun, action: () => onNavigateTab?.('weather') },
    { label: 'PM-KISAN', icon: FileText, query: lang === 'kn' ? 'ಪಿಎಂ-ಕಿಸಾನ್ ಯೋಜನೆ ಮಾಹಿತಿ ನೀಡುವಿರಾ?' : lang === 'hi' ? 'पीएम-किसान योजना की जानकारी दें' : 'PM KISAN installment eligibility details' },
    { label: t.disaster, icon: Leaf, action: () => onNavigateTab?.('disaster') },
    { label: t.mySales, icon: IndianRupee, action: () => onNavigateTab?.('market') },
    { label: t.community, icon: Gift, action: () => onNavigateTab?.('community') }
  ];

  return (
    <div className="flex flex-col h-full bg-amber-50/40 relative">
      {/* Avatar Header & Status */}
      <div className="bg-white border-b border-amber-100 p-3 shadow-2xs flex flex-col items-center">
        <div className="relative mb-1">
          <div className={`absolute -inset-2 rounded-full bg-emerald-500/20 ${status === 'listening' || status === 'speaking' ? 'animate-ping' : ''}`} />
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-700 to-emerald-500 rounded-full flex items-center justify-center text-3xl shadow-md border-2 border-white">
            🌾
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${
            status === 'listening' ? 'bg-red-100 text-red-700 animate-pulse' :
            status === 'speaking' ? 'bg-amber-100 text-amber-800' :
            status === 'thinking' ? 'bg-blue-100 text-blue-800' :
            'bg-emerald-100 text-emerald-800'
          }`}>
            {status === 'listening' ? t.listening :
             status === 'speaking' ? t.speaking :
             status === 'thinking' ? t.thinking : t.online}
          </span>
        </div>

        {/* Quick Language Switcher */}
        <div className="flex gap-1.5 mt-2 flex-wrap justify-center">
          {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => (
            <button
              key={code}
              onClick={() => onSelectLang(code)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                lang === code
                  ? 'bg-emerald-700 text-white shadow-xs font-black'
                  : 'bg-amber-100/80 text-amber-900 hover:bg-amber-200'
              }`}
            >
              {LANGUAGES[code].native}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 max-w-[90%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              msg.sender === 'user' ? 'bg-amber-600 text-white' : 'bg-emerald-700 text-white shadow-xs'
            }`}>
              {msg.sender === 'user' ? '👤' : '🌾'}
            </div>

            <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-2xs ${
              msg.sender === 'user'
                ? 'bg-emerald-700 text-white rounded-tr-none font-medium'
                : 'bg-white text-slate-800 border border-amber-100 rounded-tl-none font-medium'
            }`}>
              {msg.text}
              <div className={`text-[10px] mt-1 text-right ${
                msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
              }`}>
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'ai' && (
              <button
                onClick={() => speakText(msg.text)}
                className="p-1.5 text-slate-400 hover:text-emerald-700 transition"
                title="Listen audio"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {status === 'thinking' && (
          <div className="flex items-center gap-2 text-slate-500 text-xs bg-white p-3 rounded-2xl w-fit shadow-xs border border-amber-100">
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
            <span>{t.thinking}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Shortcuts */}
      <div className="p-2 bg-white border-t border-amber-100">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
          {shortcuts.map((sc, i) => {
            const Icon = sc.icon;
            return (
              <button
                key={i}
                onClick={() => {
                  if (sc.action) sc.action();
                  else if (sc.query) handleSend(sc.query);
                }}
                className="bg-amber-50 hover:bg-emerald-50 text-slate-800 border border-amber-200 hover:border-emerald-300 p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-left transition shadow-2xs group"
              >
                <Icon className="w-3.5 h-3.5 text-emerald-700 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">{sc.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-amber-200 focus-within:border-emerald-600 focus-within:bg-white transition">
          <button
            onClick={toggleMic}
            className={`p-2.5 rounded-full text-white transition ${
              isListening ? 'bg-red-600 animate-pulse' : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
            title="Voice input"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.typeOrSpeak}
            className="flex-1 bg-transparent px-2 text-sm text-slate-800 focus:outline-hidden"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-emerald-950 p-2.5 rounded-full transition"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
