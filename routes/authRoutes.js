const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile,
} = require('../controllers/authController');

const { validateRegisterInput } = require('../middleware/validateInput');
const upload = require('../middleware/upload'); // 🟢 Multer for image upload

// 📌 Register with image upload
router.post(
  '/register',
  upload.single('upload_img'),         // handles file upload field named 'upload_img'
  validateRegisterInput,
  registerUser
);

// 🔐 Login route
router.post('/login', loginUser);

// 👤 Profile route
router.get('/profile/:email', getUserProfile);

module.exports = router;
