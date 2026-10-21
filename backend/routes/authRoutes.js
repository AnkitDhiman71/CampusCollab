const express = require('express');
const { signup, login, logout, getMe, sendOtp, verifyOtp, updateProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validate, sendOtpSchema, verifyOtpSchema, signupSchema, loginSchema } = require('../validations');

const router = express.Router();

router.post('/send-otp', validate(sendOtpSchema), sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
