const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SECRET = process.env.JWT_SECRET || 'CHANGE_ME_IN_VERCEL';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'CHANGE_ME_IN_VERCEL';

function auth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    name: 'Moon Sat',
    storageConfigured: false,
    storage: 'none',
    time: new Date().toISOString()
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const okUser = username === ADMIN_USER;
  const okPass = bcrypt.compareSync(
    password || '',
    bcrypt.hashSync(ADMIN_PASSWORD, 10)
  );

  if (!okUser || !okPass) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  }

  const token = jwt.sign({ username: ADMIN_USER }, SECRET, { expiresIn: '12h' });
  res.json({ token, username: ADMIN_USER });

});

 /*
  Vercel's serverless filesystem is not persistent.
  This intentionally does not pretend to store uploaded files.
  When a persistent storage provider is chosen later,
  it can be connected without changing the login system.
 */

app.get('/files', auth, (req, res) => {
  res.json({ files: [], storageConfigured: false, storage: 'none' });
});

app.post('/files', auth, (req, res) => {
  res.status(503).json({
    error: 'التخزين السحابي غير مُعد'
  });
});

app.delete('/files/:name', auth, (req, res) => {
  res.status(503).json({
    error: 'حذف الملفات غير مُفعل لأن التخزين السحابي غير مُعد'
  });
});

module.exports = app;
