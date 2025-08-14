const bcrypt = require('bcryptjs');
const { createUser, findUserByEmail } = require('../models/userModel');
const cloudinary = require('../utils/cloudinary');

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'delivery_agents' },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

const registerUser = async (req, res) => {
  const { fullName, email, phone, password, vehicle, govtId } = req.body;

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Govt ID image is required' });
    }

    const result = await uploadToCloudinary(req.file.buffer);
    const imageUrl = result.secure_url;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      name: fullName,
      email,
      phone,
      passwordHash: hashedPassword,
      vehicle,
      govt_id: govtId,
      upload_img: imageUrl,
    });

    return res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Server error during registration' });
  }
};


// LOGIN
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const { user_id, name, phone, email: userEmail, vehicle_details } = user;

    res.status(200).json({
      message: 'Login successful',
      user: {
        user_id,
        name,
        phone,
        email: userEmail,
        vehicle: vehicle_details,
      },
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

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};
