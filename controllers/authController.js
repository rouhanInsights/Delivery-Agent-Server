const bcrypt = require('bcrypt');
const { createUser, findUserByEmail } = require('../models/userModel');
const cloudinary = require('../utils/cloudinary');

const uploadToCloudinary = (fileBuffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'delivery_agents' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(fileBuffer);
  });

const registerUser = async (req, res) => {
  console.log('📥 Incoming Registration Request');
  console.log('➡️ BODY keys:', Object.keys(req.body || {}));
  const filesArr = req.files || (req.file ? [req.file] : []);
  console.log(
    '➡️ FILES:',
    filesArr.map((f) => ({ field: f.fieldname, type: f.mimetype, size: f.size }))
  );

  // Normalize inputs so old/new clients both work
  const raw = req.body || {};
  const fullName = (raw.fullName || raw.name || '').trim();
  const email    = (raw.email || '').trim();
  const phone    = (raw.phone || '').trim();
  const password = (raw.password || '').trim();
  const vehicle  = (raw.vehicle || '').trim();
  const govtId   = (raw.govtId || raw.govt_id || '').trim();

  // Support upload.single('upload_img') or upload.any()
  const file = req.file || (Array.isArray(req.files) ? req.files.find(f => f.fieldname === 'upload_img') : null);

  const missing = [];
  if (!fullName) missing.push('fullName/name');
  if (!email)    missing.push('email');
  if (!phone)    missing.push('phone');
  if (!password) missing.push('password');
  if (!vehicle)  missing.push('vehicle');
  if (!govtId)   missing.push('govtId/govt_id');
  if (!file)     missing.push('upload_img');
  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  try {
    console.log('🔍 Checking if user already exists for email:', email);
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      console.warn('⚠️ Email already registered:', email);
      return res.status(409).json({ error: 'Email already registered' });
    }

    console.log('⬆️ Uploading Govt ID to Cloudinary...');
    const { secure_url } = await uploadToCloudinary(file.buffer);
    console.log('✅ Cloudinary Upload Result:', secure_url);

    console.log('🔑 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    console.log('💾 Inserting user into database...');
    const user = await createUser({
      name: fullName,
      email,
      phone,
      passwordHash,
      vehicle,
      govtId,            // ✅ correct key expected by the model
      upload_img: secure_url,
    });
    console.log('✅ User created successfully with ID:', user.user_id);

    return res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error('❌ Registration Error:', error);
    return res.status(500).json({ error: 'Server error during registration', details: error.message });
  }
};

// LOGIN
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid email' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    const { user_id, name, phone, email: userEmail, vehicle_details } = user;

    res.status(200).json({
      message: 'Login successful',
      user: { user_id, name, phone, email: userEmail, vehicle: vehicle_details },
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// PROFILE
const getUserProfile = async (req, res) => {
  const { email } = req.params;

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({
      name: user.name,
      email: user.email,
      phone: user.phone,
      vehicle: user.vehicle_details,
    });
  } catch (err) {
    console.error('Profile Fetch Error:', err);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

module.exports = { registerUser, loginUser, getUserProfile };
