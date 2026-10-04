const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SECRET = process.env.JWT_SECRET || 'CHANGE_ME_IN_VERCEL';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'CHANGE_ME_IN_VERCEL';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'moon-sat-files';
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function auth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    req.user = jwt.verify(token, SECRET);
    next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
}

app.get('/api/health', (req, res) => res.json({
  ok: true,
  name: 'Moon Sat',
  storageConfigured: !!supabase,
  time: new Date().toISOString()
}));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const okUser = username === ADMIN_USER;
  const okPass = bcrypt.compareSync(password || '', bcrypt.hashSync(ADMIN_PASSWORD, 10));
  if (!okUser || !okPass) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  const token = jwt.sign({ username: ADMIN_USER }, SECRET, { expiresIn: '12h' });
  res.json({ token, username: ADMIN_USER });
});

app.get('/api/files', auth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'لم يتم إعداد التخزين السحابي بعد' });
  const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
  if (error) return res.status(500).json({ error: error.message });
  const files = (data || []).filter(x => x.name).map(x => {
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(x.name);
    return { name: x.name, size: x.metadata?.size || 0, url: pub.publicUrl, updatedAt: x.updated_at || null };
  });
  res.json({ files });
});

app.post('/api/files', auth, upload.single('file'), async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'لم يتم إعداد التخزين السحابي بعد' });
  if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار ملف' });
  const safeName = `${Date.now()}-${String(req.file.originalname).replace(/[^\w.\-\u0600-\u06FF ]/g, '_')}`;
  const { error } = await supabase.storage.from(BUCKET).upload(safeName, req.file.buffer, {
    contentType: req.file.mimetype || 'application/octet-stream',
    upsert: false
  });
  if (error) return res.status(500).json({ error: error.message });
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(safeName);
  res.json({ name: req.file.originalname, storedName: safeName, size: req.file.size, url: pub.publicUrl });
});

app.delete('/api/files/:name', auth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'لم يتم إعداد التخزين السحابي بعد' });
  const name = decodeURIComponent(req.params.name);
  const { error } = await supabase.storage.from(BUCKET).remove([name]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = app;
