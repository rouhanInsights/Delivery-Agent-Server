const pool = require('../config/db');

const createUser = async ({ name, email, phone, passwordHash, vehicle, govtId, upload_img }) => {
  const query = `
    INSERT INTO da_users (name, email, phone, password_hash, vehicle_details, govt_id, availability, upload_img)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING user_id, name, email, phone, vehicle_details, upload_img, created_at
  `;
  const values = [name, email, phone, passwordHash, vehicle, govtId, true, upload_img];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM da_users WHERE email = $1', [email]);
  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
};
