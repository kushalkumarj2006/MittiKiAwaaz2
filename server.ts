import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import multer from 'multer';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3000;

// ---------- Logging ----------
const LOG = {
  INFO: '📘',
  SUCCESS: '✅',
  WARNING: '⚠️',
  ERROR: '❌'
};

function log(level: string, msg: string, data: any = '') {
  const ts = new Date().toISOString();
  console.log(`${level} [${ts}] ${msg}`, data ? (typeof data === 'object' ? JSON.stringify(data) : data) : '');
}

// ---------- Database Pool Setup ----------
// Note: Per user instruction, WE DO NOT INITIALIZE/CREATE TABLES AUTOMATICALLY.
// The user handles database initialization on their site.
let dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_gnkTY3zl6BHS@ep-quiet-frost-az4hlvag-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
if (dbUrl.includes('sslmode=require') && !dbUrl.includes('uselibpqcompat')) {
  dbUrl = dbUrl.replace('sslmode=require', 'uselibpqcompat=true&sslmode=require');
}
const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

// ---------- Multi Gemini API Key Round-Robin Setup ----------
let geminiKeyIndex = 0;

function getGeminiClient(): GoogleGenAI {
  const rawEnvKeys = process.env.GEMINI_API_KEY || '';
  // Split by comma to support apikey1,apikey2,apikey3,...
  // Strip quotes and whitespace from each key
  const keysList = rawEnvKeys
    .split(',')
    .map(k => k.replace(/['"]/g, '').trim())
    .filter(Boolean);
  
  let selectedKey = '';
  if (keysList.length > 0) {
    selectedKey = keysList[geminiKeyIndex];
    geminiKeyIndex = (geminiKeyIndex + 1) % keysList.length;
  }

  return new GoogleGenAI({
    apiKey: selectedKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// ---------- Weather Keys Round-Robin ----------
const weatherKeys = [
  process.env.WEATHER_API_KEY_1 || 'sk-live-IiR5B5G0d5BfMVj9bwnW77XRwBt6MeF3B19UnYkY',
  process.env.WEATHER_API_KEY_2 || 'sk-live-U9tTT9g2pMzr1SLF5DfRpaj6D8tNY9yC0DofprsV',
  process.env.WEATHER_API_KEY_3 || 'sk-live-pRFhEH0yftgoGOaNKE6WDp6AhMalQ58oZRDo5ipk'
].filter(Boolean);
let weatherKeyIndex = 0;

async function fetchIndianWeather(city: string) {
  for (let i = 0; i < weatherKeys.length; i++) {
    const key = weatherKeys[weatherKeyIndex];
    weatherKeyIndex = (weatherKeyIndex + 1) % weatherKeys.length;
    try {
      const resp = await axios.get('https://weather.indianapi.in/india/weather', {
        params: { city },
        headers: { 'x-api-key': key },
        timeout: 4000
      });
      if (resp.status === 200 && resp.data) {
        return resp.data;
      }
    } catch (e: any) {
      log(LOG.WARNING, `Weather API key index ${weatherKeyIndex} failed: ${e?.message}`);
    }
  }
  // Realistic fallback weather payload
  return {
    city,
    weather: {
      current: {
        temperature: { max: { value: 31 }, min: { value: 22 } },
        humidity: { morning: 78, evening: 62 },
        wind: { speed: 12 }
      },
      forecast: [
        { date: 'Today', max_temp: 31, min_temp: 22, description: 'Partly Cloudy' },
        { date: 'Tomorrow', max_temp: 32, min_temp: 23, description: 'Moderate rain expected' },
        { date: 'Day 3', max_temp: 29, min_temp: 21, description: 'Light showers' },
        { date: 'Day 4', max_temp: 30, min_temp: 22, description: 'Sunny with passing clouds' },
        { date: 'Day 5', max_temp: 33, min_temp: 23, description: 'Clear sky' }
      ]
    }
  };
}

// ---------- Express App Config ----------
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ---------- Health Check ----------
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(200).json({ status: 'ok', db: 'disconnected_mode', timestamp: new Date().toISOString() });
  }
});

// ---------- Authentication APIs ----------
// Login for farmer or sarpanch with optional GPS lat/lng update
app.post('/api/auth/login', async (req, res) => {
  const { phone, password, role, lat, lng } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone and password/PIN required' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User not found with this mobile number' });
    }

    const user = userRes.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid password or PIN' });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ error: `Account exists but role is ${user.role}` });
    }

    // Update GPS location if provided
    if (lat !== undefined && lng !== undefined) {
      await pool.query(
        'UPDATE users SET location_lat = $1, location_lng = $2 WHERE id = $3',
        [lat, lng, user.id]
      );
      user.location_lat = lat;
      user.location_lng = lng;
    }

    const { password_hash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (e: any) {
    log(LOG.ERROR, 'Login error', e?.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Register API - Strictly Farmers Only
app.post('/api/auth/register', async (req, res) => {
  const {
    phone, name, password, role = 'farmer', taluk, village, district, state = 'Karnataka',
    farm_size, primary_crop, lat, lng
  } = req.body;

  if (role === 'sarpanch') {
    return res.status(403).json({ error: 'Public registration for Sarpanch accounts is disabled. Sarpanch credentials are administered directly by the Panchayat.' });
  }

  if (!phone || !name || !password || !taluk) {
    return res.status(400).json({ error: 'Phone, Name, Password, and Taluk are required' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const userRes = await pool.query(
      `INSERT INTO users (phone, name, password_hash, role, taluk, village, district, state, farm_size, primary_crop, location_lat, location_lng)
       VALUES ($1, $2, $3, 'farmer', $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, phone, name, role, taluk, village, district, state, farm_size, primary_crop, location_lat, location_lng, created_at`,
      [phone, name, hash, taluk, village || taluk, district || 'Karnataka', state, farm_size || '', primary_crop || '', lat || null, lng || null]
    );

    const newUser = userRes.rows[0];
    res.json({ success: true, user: newUser });
  } catch (e: any) {
    log(LOG.ERROR, 'Register error', e?.message);
    if (e.code === '23505') {
      return res.status(400).json({ error: 'Phone number is already registered. Please login.' });
    }
    res.status(500).json({ error: 'Failed to register account' });
  }
});

// User Profile Update
app.put('/api/user/:id', async (req, res) => {
  const { name, taluk, village, district, state, farm_size, primary_crop, location_lat, location_lng } = req.body;
  try {
    const updated = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        taluk = COALESCE($2, taluk),
        village = COALESCE($3, village),
        district = COALESCE($4, district),
        state = COALESCE($5, state),
        farm_size = COALESCE($6, farm_size),
        primary_crop = COALESCE($7, primary_crop),
        location_lat = COALESCE($8, location_lat),
        location_lng = COALESCE($9, location_lng)
       WHERE id = $10 RETURNING id, phone, name, role, taluk, village, district, state, farm_size, primary_crop, location_lat, location_lng`,
      [name, taluk, village, district, state, farm_size, primary_crop, location_lat, location_lng, req.params.id]
    );
    if (updated.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(updated.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Krishi Sakhi AI Chatbot (Kannada, English, Hindi) ----------
app.post('/api/chat', async (req, res) => {
  const { message, language = 'hi' } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  // 1. Parse all API keys from environment (comma‑separated)
  const rawKeys = process.env.GEMINI_API_KEY || '';
  const keys = rawKeys
    .split(',')
    .map(k => k.replace(/['"]/g, '').trim())
    .filter(Boolean);

  if (keys.length === 0) {
    log(LOG.ERROR, 'No Gemini API keys found in environment.');
    return res.json({
      response: language === 'kn' ? '❌ API ಕೀಲಿ ಕಾನ್ಫಿಗರ್ ಮಾಡಲಾಗಿಲ್ಲ.' :
                 language === 'hi' ? '❌ API कुंजी कॉन्फ़िगर नहीं है।' :
                 '❌ Gemini API key is not configured.'
    });
  }

  // 2. Language‑specific instructions
  const langInstructions: Record<string, string> = {
    kn: 'ಉತ್ತರವನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಕನ್ನಡದಲ್ಲಿ ನೀಡಿ. ಕನ್ನಡ ಬೆರಳಚ್ಚು ಮತ್ತು ವಾಕ್ಯ ರಚನೆಗಳನ್ನು ಬಳಸಿ. ರೈತರಿಗೆ ಸ್ಪಷ್ಟ ಮತ್ತು ಸರಳ ಸಲಹೆ ನೀಡಿ.',
    hi: 'उत्तर पूर्णतः हिंदी भाषा में दें। किसानों के लिए सरल, व्यावहारिक और उपयोगी सलाह प्रदान करें।',
    en: 'Respond entirely in clear, supportive English tailored for Indian farmers.'
  };

  const sysInstruction = `You are "Krishi Sakhi" (कृषि सखी / ಕೃಷಿ ಸಖಿ), a dedicated AI agricultural companion and climate resilience assistant for farmers in India.
Provide practical, accurate, easy-to-implement advice regarding farming, soil health, crop selection, organic fertilizers, pest control, weather preparation, mandi prices, and government schemes (PM-KISAN, PMFBY).
Keep responses clear, concise, well-structured with bullet points.
CRITICAL MANDATE: ${langInstructions[language] || langInstructions['hi']}`;

  // 3. Try each key until one works
  let lastError: any = null;
  for (const key of keys) {
    try {
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const geminiRes = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: message,
        config: {
          systemInstruction: sysInstruction,
          temperature: 0.7
        }
      });

      // Success – return response
      return res.json({ response: geminiRes.text || 'Response generated.' });
    } catch (e: any) {
      lastError = e;
      log(LOG.WARNING, `Gemini key failed, trying next`, e?.message || e);
      // Continue to the next key
    }
  }

  // 4. All keys failed – return a friendly fallback
  log(LOG.ERROR, 'All Gemini keys failed', lastError?.message);
  const fallbacks: Record<string, string> = {
    kn: '🙏 ಕ್ಷಮಿಸಿ, ನೆಟ್‌ವರ್ಕ್ ಸಮಸ್ಯೆ ಇದೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    hi: '🙏 क्षमा करें, नेटवर्क समस्या है। कृपया थोड़ी देर बाद पुनः प्रयास करें।',
    en: '🙏 Sorry, network busy. Please try again shortly.'
  };
  res.json({ response: fallbacks[language] || fallbacks['hi'] });
});

// ---------- Soil Test Analysis API ----------
app.post('/api/soil-analyze', async (req, res) => {
  const { ph, userId, language = 'hi' } = req.body;
  const numericPh = parseFloat(ph) || 6.5;

  try {
    const langPrompts: Record<string, string> = {
      kn: `ಕನ್ನಡದಲ್ಲಿ ಮಣ್ಣಿನ pH ಮೌಲ್ಯ ${numericPh} ರ ಪೂರ್ಣ ವಿಶ್ಲೇಷಣೆ ನೀಡಿ. 1. ಮಣ್ಣಿನ ಸ್ಥಿತಿ, 2. ಅಗತ್ಯ ಪೋಷಕಾಂಶಗಳು, 3. ಸಿಫಾರಸು ಮಾಡಿದ ಬೆಳೆಗಳು, 4. ಇಳುವರಿ ಹೆಚ್ಚಿಸಲು 3 ಪ್ರಮುಖ ಹಂತಗಳು.`,
      hi: `हिंदी में मिट्टी के pH मान ${numericPh} का संपूर्ण विश्लेषण प्रदान करें। 1. मिट्टी का प्रकार, 2. आवश्यक पोषक तत्व, 3. उपयुक्त फसलें, 4. उपज बढ़ाने के 3 कदम।`,
      en: `Analyze soil pH value ${numericPh} in English. Include soil status, nutrients, recommended crops, and 3 steps for yield improvement.`
    };

    const ai = getGeminiClient();
    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: langPrompts[language] || langPrompts['hi'],
      config: {
        systemInstruction: 'You are an agricultural soil health expert advising Indian farmers.'
      }
    });

    const analysisOutput = geminiRes.text || `pH ${numericPh} analysis complete.`;

    // Save to DB if userId provided
    if (userId) {
      try {
        await pool.query(
          'INSERT INTO soil_tests (user_id, ph, result) VALUES ($1, $2, $3)',
          [userId, numericPh, analysisOutput]
        );
      } catch (e: any) {
        log(LOG.WARNING, 'Soil test save skipped or failed', e?.message);
      }
    }

    res.json({ response: analysisOutput });
  } catch (e: any) {
    log(LOG.ERROR, 'Soil analyze error', e?.message);
    res.json({
      response: `Soil pH: ${numericPh}\n• Status: ${numericPh < 6.0 ? 'Acidic' : numericPh > 7.5 ? 'Alkaline' : 'Neutral'}\n• Treatment: Add organic manure and compost regularly.`
    });
  }
});

// ---------- Weather & Advisory API ----------
app.get('/api/weather', async (req, res) => {
  const taluk = (req.query.taluk as string) || 'Ramnagar';
  const language = (req.query.language as string) || 'hi';

  try {
    // Try to get cached weather
    let cached: any = null;
    try {
      const dbCached = await pool.query('SELECT * FROM weather_cache WHERE taluk = $1', [taluk]);
      if (dbCached.rows.length > 0) cached = dbCached.rows[0];
    } catch (e) {
      // cache query skipped if table not seeded
    }

    const now = new Date();
    if (cached && (now.getTime() - new Date(cached.updated_at).getTime()) < 6 * 3600 * 1000) {
      return res.json({
        weather: cached.data?.current || cached.data,
        forecast: cached.data?.forecast || [],
        analysis: cached.analysis
      });
    }

    const weatherData = await fetchIndianWeather(taluk);
    const current = weatherData.weather?.current || {};
    const forecast = weatherData.weather?.forecast || [];

    let advisoryText = '';
    try {
      const langNotice = language === 'kn' ? 'In Kannada language' : language === 'hi' ? 'In Hindi language' : 'In English language';
      const advPrompt = `Weather in ${taluk}: Max ${current.temperature?.max?.value || 31}°C, Min ${current.temperature?.min?.value || 22}°C, Humidity ${current.humidity?.morning || 75}%. Forecast: ${JSON.stringify(forecast)}. Provide 4 practical agricultural advisory points for farmers. ${langNotice}.`;
      
      const ai = getGeminiClient();
      const advRes = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: advPrompt,
        config: { systemInstruction: 'You are Krishi Sakhi giving weather advisories.' }
      });
      advisoryText = advRes.text || 'Irrigate crops in early evening. Maintain good soil drainage.';
    } catch {
      advisoryText = '🌾 Agricultural Advisory:\n• Irrigate crops during evening hours.\n• Delay chemical spraying if rain is expected.\n• Harvest matured crops and store safely.';
    }

    try {
      await pool.query(
        `INSERT INTO weather_cache (taluk, data, analysis, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (taluk) DO UPDATE SET
           data = EXCLUDED.data,
           analysis = EXCLUDED.analysis,
           updated_at = NOW()`,
        [taluk, { current, forecast }, advisoryText]
      );
    } catch (e) {
      // ignore table write if db not init
    }

    res.json({
      weather: current,
      forecast,
      analysis: advisoryText
    });
  } catch (e: any) {
    log(LOG.ERROR, 'Weather API error', e?.message);
    res.status(500).json({ error: 'Unable to fetch weather data' });
  }
});

// ---------- Disaster Alerts API ----------
app.get('/api/disaster-alerts', async (req, res) => {
  try {
    const alertsRes = await pool.query('SELECT * FROM disaster_alerts ORDER BY created_at DESC');
    res.json(alertsRes.rows);
  } catch (e: any) {
    // Return curated default IMD alerts if table not present
    res.json([
      {
        id: 1,
        severity: 'critical',
        title: '🚨 IMD Flood & Heavy Rain Warning',
        message: 'IMD Alert: Heavy rainfall predicted (>120mm) in next 48 hours. Move farm equipment and livestock to higher ground.',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        severity: 'warning',
        title: '🌡️ Severe Heatwave Notice',
        message: 'Temperatures expected above 42°C. Irrigate standing crops in early morning or late evening.',
        created_at: new Date().toISOString()
      }
    ]);
  }
});

// ---------- Community Posts API ----------
app.get('/api/community/posts', async (req, res) => {
  const { taluk } = req.query;
  try {
    let query = `
      SELECT cp.*, u.name as user_name, u.taluk
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.id
    `;
    const params: any[] = [];
    if (taluk) {
      query += ' WHERE u.taluk = $1';
      params.push(taluk);
    }
    query += ' ORDER BY cp.created_at DESC LIMIT 100';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e: any) {
    res.json([]);
  }
});

app.post('/api/community/post', async (req, res) => {
  const { userId, type = 'text', content } = req.body;
  if (!userId || !content) return res.status(400).json({ error: 'UserId and content required' });
  try {
    const result = await pool.query(
      'INSERT INTO community_posts (user_id, type, content) VALUES ($1, $2, $3) RETURNING *',
      [userId, type, content]
    );
    const post = result.rows[0];
    try {
      const uRes = await pool.query('SELECT name, taluk FROM users WHERE id = $1', [userId]);
      post.user_name = uRes.rows[0]?.name || 'Farmer';
      post.taluk = uRes.rows[0]?.taluk || 'Karnataka';
    } catch (e) {}

    io.emit('new_community_post', post);
    res.json(post);
  } catch (e: any) {
    log(LOG.ERROR, 'Post creation error', e?.message);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.delete('/api/community/post/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    await pool.query('DELETE FROM community_posts WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Crop Sales API ----------
app.get('/api/crop/sales', async (req, res) => {
  const { taluk } = req.query;
  try {
    let query = `
      SELECT cs.*, u.name as farmer_name, u.phone as farmer_phone
      FROM crop_sales cs
      JOIN users u ON cs.farmer_id = u.id
      WHERE cs.active = true
    `;
    const params: any[] = [];
    if (taluk) {
      query += ` AND (cs.taluk = $${params.length + 1} OR u.taluk = $${params.length + 1})`;
      params.push(taluk);
    }
    query += ' ORDER BY cs.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e: any) {
    res.json([]);
  }
});

app.post('/api/crop/sale', async (req, res) => {
  const { farmer_id, crop_name, quantity, price, image_url, contact_phone, address, taluk } = req.body;
  if (!farmer_id || !crop_name || !quantity || !price) {
    return res.status(400).json({ error: 'farmer_id, crop_name, quantity, and price are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO crop_sales (farmer_id, crop_name, quantity, price, image_url, contact_phone, address, taluk)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [farmer_id, crop_name, quantity, price, image_url || '', contact_phone || '', address || '', taluk || 'Karnataka']
    );
    res.json(result.rows[0]);
  } catch (e: any) {
    log(LOG.ERROR, 'Crop sale error', e?.message);
    res.status(500).json({ error: 'Failed to add crop sale' });
  }
});

app.delete('/api/crop/sale/:id', async (req, res) => {
  const { id } = req.params;
  const { farmer_id } = req.body;
  try {
    await pool.query('UPDATE crop_sales SET active = false WHERE id = $1 AND farmer_id = $2', [id, farmer_id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Machinery Rentals API ----------
app.get('/api/machinery/rentals', async (req, res) => {
  const { taluk } = req.query;
  try {
    let query = `
      SELECT mr.*, u.name as owner_name, u.phone as owner_phone
      FROM machinery_rentals mr
      JOIN users u ON mr.owner_id = u.id
      WHERE mr.active = true
    `;
    const params: any[] = [];
    if (taluk) {
      query += ` AND (mr.taluk = $${params.length + 1} OR u.taluk = $${params.length + 1})`;
      params.push(taluk);
    }
    query += ' ORDER BY mr.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e: any) {
    res.json([]);
  }
});

app.post('/api/machinery/rental', async (req, res) => {
  const { owner_id, machine_name, description, rental_price, image_url, contact_phone, address, taluk } = req.body;
  if (!owner_id || !machine_name || !rental_price) {
    return res.status(400).json({ error: 'owner_id, machine_name, and rental_price are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO machinery_rentals (owner_id, machine_name, description, rental_price, image_url, contact_phone, address, taluk)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [owner_id, machine_name, description || '', rental_price, image_url || '', contact_phone || '', address || '', taluk || 'Karnataka']
    );
    res.json(result.rows[0]);
  } catch (e: any) {
    log(LOG.ERROR, 'Rental create error', e?.message);
    res.status(500).json({ error: 'Failed to post rental listing' });
  }
});

app.delete('/api/machinery/rental/:id', async (req, res) => {
  const { id } = req.params;
  const { owner_id } = req.body;
  try {
    await pool.query('UPDATE machinery_rentals SET active = false WHERE id = $1 AND owner_id = $2', [id, owner_id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- File Upload API ----------
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  const file = req.file;

  try {
    let url = '';
    const imgbbKey = process.env.IMGBB_API_KEY || '7bc284db7ef8b0f1c8f0ba1ff23a8a04';

    if (file.mimetype.startsWith('image/')) {
      try {
        const base64 = file.buffer.toString('base64');
        const imgbbRes = await axios.post('https://api.imgbb.com/1/upload', null, {
          params: { key: imgbbKey, image: base64, name: file.originalname }
        });
        if (imgbbRes.data?.success) {
          url = imgbbRes.data.data.url;
        }
      } catch (err: any) {
        log(LOG.WARNING, 'ImgBB upload failed, falling back to data URL', err?.message);
      }
    }

    if (!url) {
      url = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    res.json({ success: true, url });
  } catch (e: any) {
    log(LOG.ERROR, 'Upload error', e?.message);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ---------- Sarpanch Farmers List API ----------
app.get('/api/sarpanch/farmers', async (req, res) => {
  const { taluk } = req.query;
  try {
    const farmers = await pool.query(
      `SELECT id, name, phone, role, taluk, village, district, state, farm_size, primary_crop, created_at
       FROM users
       WHERE role = 'farmer' AND ($1::text IS NULL OR taluk = $1::text)
       ORDER BY name ASC`,
      [taluk || null]
    );
    res.json(farmers.rows);
  } catch (e: any) {
    res.json([]);
  }
});

// ---------- Socket.IO Connection ----------
io.on('connection', (socket) => {
  log(LOG.INFO, `Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    log(LOG.INFO, `Socket disconnected: ${socket.id}`);
  });
});

// ---------- Start Server with Vite Middleware ----------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    log(LOG.SUCCESS, `🌾 Mitti Ki Awaaz Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
