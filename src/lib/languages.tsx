import { LanguageCode } from '../types';

export interface Translation {
  title: string;
  krishiSakhi: string;
  soil: string;
  disaster: string;
  community: string;
  mySales: string;
  rentals: string;
  weather: string;
  settings: string;
  sarpanch: string;
  publicMarket: string;
  online: string;
  listening: string;
  speaking: string;
  thinking: string;
  typeOrSpeak: string;
  phLabel: string;
  analyzeSoil: string;
  recentRecords: string;
  alerts: string;
  checklists: string;
  addSale: string;
  postRental: string;
  saveSettings: string;
  fetchLocation: string;
  greeting: string;
  farmerLogin: string;
  sarpanchLogin: string;
  publicVisitor: string;
  stopAudio: string;
}

export const LANGUAGES: Record<LanguageCode, { name: string; native: string; code: string }> = {
  kn: { name: 'Kannada', native: 'ಕನ್ನಡ', code: 'kn-IN' },
  en: { name: 'English', native: 'English', code: 'en-US' },
  hi: { name: 'Hindi', native: 'हिंदी', code: 'hi-IN' }
};

export const TRANSLATIONS: Record<LanguageCode, Translation> = {
  kn: {
    title: 'ಮಿಟ್ಟಿ ಕೀ ಆವಾಝ್',
    krishiSakhi: 'ಕೃಷಿ ಸಖಿ',
    soil: 'ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ',
    disaster: 'ವಿಪತ್ತು ಎಚ್ಚರಿಕೆ',
    community: 'ಸಮುದಾಯ',
    mySales: 'ಬೆಳೆ ಮಾರಾಟ',
    rentals: 'ಯಂತ್ರೋಪಕರಣ ಬಾಡಿಗೆ',
    weather: 'ಹವಾಮಾನ',
    settings: 'ಸಂಯೋಜನೆಗಳು',
    sarpanch: 'ಸರ್ಪಂಚ್',
    publicMarket: 'ಸಾರ್ವಜನಿಕ ಮಾರುಕಟ್ಟೆ',
    online: '● ಆನ್‌ಲೈನ್',
    listening: '🎤 ಕೇಳುತ್ತಿದ್ದೇನೆ...',
    speaking: '🔊 ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ...',
    thinking: '⏳ ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ...',
    typeOrSpeak: 'ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ...',
    phLabel: 'pH ಮೌಲ್ಯ ಆಯ್ಕೆಮಾಡಿ',
    analyzeSoil: '🔬 ಮಣ್ಣು ವಿಶ್ಲೇಷಿಸಿ',
    recentRecords: '📜 ಇತ್ತೀಚಿನ ದಾಖಲೆಗಳು',
    alerts: '🚨 ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು',
    checklists: '🛡️ ಸುರಕ್ಷತಾ ಪಟ್ಟಿ',
    addSale: '➕ ಬೆಳೆ ಸೇರಿಸಿ',
    postRental: '🚜 ಯಂತ್ರ ಬಾಡಿಗೆಗೆ ನೀಡಿ',
    saveSettings: '💾 ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ',
    fetchLocation: '📍 ಜಿಪಿಎಸ್ ಸ್ಥಳ ಪತ್ತೆ ಮಾಡಿ',
    greeting: '👋 ನಮಸ್ಕಾರ! ನಾನು ಕೃಷಿ ಸಖಿ. ಇಂದು ನಿಮ್ಮ ಹೊಲದ ಸ್ಥಿತಿ ಹೇಗಿದೆ?',
    farmerLogin: 'ರೈತರ ಲಾಗಿನ್',
    sarpanchLogin: 'ಸರ್ಪಂಚ್ ಲಾಗಿನ್',
    publicVisitor: 'ಸಾರ್ವಜನಿಕ ವೀಕ್ಷಣೆ',
    stopAudio: 'ಆಡಿಯೋ ನಿಲ್ಲಿಸಿ'
  },
  en: {
    title: 'Mitti Ki Awaaz',
    krishiSakhi: 'Krishi Sakhi',
    soil: 'Soil Health',
    disaster: 'Disaster Alerts',
    community: 'Community',
    mySales: 'Crop Sales',
    rentals: 'Machinery Rentals',
    weather: 'Weather Advisory',
    settings: 'Settings',
    sarpanch: 'Sarpanch Portal',
    publicMarket: 'Public Marketplace',
    online: '● Online',
    listening: '🎤 Listening...',
    speaking: '🔊 Speaking...',
    thinking: '⏳ Thinking...',
    typeOrSpeak: 'Type or talk here...',
    phLabel: 'Select Soil pH Value',
    analyzeSoil: '🔬 Analyze Soil Health',
    recentRecords: '📜 Test History',
    alerts: '🚨 Weather Alerts',
    checklists: '🛡️ Safety Checklists',
    addSale: '➕ List Crop Sale',
    postRental: '🚜 Post Machinery Rental',
    saveSettings: '💾 Save Profile',
    fetchLocation: '📍 Auto-detect GPS Location',
    greeting: '👋 Namaste! I am Krishi Sakhi. How is your field today?',
    farmerLogin: 'Farmer Login',
    sarpanchLogin: 'Sarpanch Login',
    publicVisitor: 'Public Portal',
    stopAudio: 'Stop Audio'
  },
  hi: {
    title: 'मिट्टी की आवाज़',
    krishiSakhi: 'कृषि सखी',
    soil: 'मिट्टी जाँच',
    disaster: 'आपदा चेतावनी',
    community: 'समुदाय',
    mySales: 'फसल बिक्री',
    rentals: 'मशीनरी किराया',
    weather: 'मौसम व सलाह',
    settings: 'सेटिंग्स',
    sarpanch: 'सरपंच पोर्टल',
    publicMarket: 'सार्वजनिक बाज़ार',
    online: '● ऑनलाइन',
    listening: '🎤 सुन रहा हूँ...',
    speaking: '🔊 बोल रहा हूँ...',
    thinking: '⏳ सोच रहा हूँ...',
    typeOrSpeak: 'यहाँ लिखें या बोलें...',
    phLabel: 'pH मान चुनें',
    analyzeSoil: '🔬 मिट्टी परीक्षण करें',
    recentRecords: '📜 हालिया रिपोर्ट',
    alerts: '🚨 मौसम अलर्ट',
    checklists: '🛡️ सुरक्षा चेकलिस्ट',
    addSale: '➕ नई फसल जोड़ें',
    postRental: '🚜 मशीनरी किराये पर दें',
    saveSettings: '💾 जानकारी सहेजें',
    fetchLocation: '📍 GPS लोकेशन ऑटो-डिटेक्ट करें',
    greeting: '👋 नमस्ते! मैं कृषि सखी हूँ। आज आपके खेत का क्या हाल है?',
    farmerLogin: 'किसान लॉगिन',
    sarpanchLogin: 'सरपंच लॉगिन',
    publicVisitor: 'सार्वजनिक पोर्टल',
    stopAudio: 'ऑडियो रोकें'
  }
};
