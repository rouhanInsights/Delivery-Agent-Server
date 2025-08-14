const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => res.status(200).json({status: 'ok'}));
app.get('/api/health/db', async (req, res) => {
  try {
    const r = await pool.query('SELECT 1 as ok');
    res.json({ ok: true, db: r.rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
 // ✅ no need to require again inline

const PORT =  8080;
app.listen(PORT, () => console.log(`Server running on port 🚀 ${PORT}`));
