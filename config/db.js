const { Pool } = require('pg');
require('dotenv').config();
const isSocket = (h) => typeof h === 'string' && h.startsWith('/cloudsql/');
const pool = new Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
});
ssl: isSocket(process.env.PG_HOST) ? false : { rejectUnauthorized: false },
module.exports = pool;
