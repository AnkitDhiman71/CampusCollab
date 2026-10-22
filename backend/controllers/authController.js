const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Otp = require('../models/otpModel');
const { isAdminEmail, sendOtpEmail } = require('../config/nodemailer');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'campuscollab_jwt_secret_key_30min_session', { expiresIn: '30m' });
};

const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id);
  res.cookie('token', token, {
    expires: new Date(Date.now() + 30 * 60 * 1000),
    maxAge: 30 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      skills: user.skills,
      role: user.role,
      openToWork: user.openToWork !== false,
      githubUrl: user.githubUrl || '',
      bio: user.bio || '',
      ranking: user.ranking || '🌱 Rising Contributor',
      rankingPoints: user.rankingPoints || 500,
      projects: user.projects || [],
      repositories: user.repositories || [],
    },
  });
};

const sendOtp = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'An account with this email already exists.' });

    if (isAdminEmail(email)) {
      return res.json({ success: true, isAdmin: true, message: 'Admin email detected. OTP bypassed.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteOne({ email });
    await Otp.create({ email, otp });

    const emailResult = await sendOtpEmail(email, otp);
    const msg = (emailResult?.warning || emailResult?.devMode)
      ? `(Notice: Cloud host blocked SMTP) Your OTP is: ${otp}`
      : 'OTP sent to your email successfully. Please check your inbox.';

    return res.json({
      success: true,
      isAdmin: false,
      message: msg,
      devOtp: (emailResult?.warning || emailResult?.devMode) ? otp : undefined,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    if (isAdminEmail(email)) {
      return res.json({ success: true, isAdmin: true, message: 'Admin email verified.' });
    }

    const record = await Otp.findOne({ email, otp: req.body.otp.toString().trim() });
    if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });

    await Otp.updateOne({ _id: record._id }, { $set: { verified: true } });
    return res.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const signup = async (req, res) => {
  try {
    const { name, password, department, skills, otp, githubUrl, bio } = req.body;
    const email = req.body.email.toLowerCase().trim();
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'User already exists with this email.' });

    const isAdmin = isAdminEmail(email);
    if (!isAdmin) {
      const record = await Otp.findOne({ email });
      const isValid = record && (record.verified || (otp && record.otp === otp.toString().trim()));
      if (!isValid) return res.status(400).json({ success: false, message: 'Please verify your email with OTP before registering.' });
      await Otp.deleteOne({ email });
    }

    let formattedGithub = '';
    if (githubUrl && githubUrl.trim()) {
      const g = githubUrl.trim();
      formattedGithub = g.startsWith('http') ? g : `https://github.com/${g.replace(/^@/, '')}`;
    }

    const initialSkillCount = skills ? skills.split(',').filter(Boolean).length : 0;
    const initialPoints = 500 + initialSkillCount * 50;

    const user = await User.create({
      name: name.trim(),
      email,
      password,
      department: department || 'General',
      skills: skills || '',
      role: isAdmin ? 'admin' : 'user',
      githubUrl: formattedGithub,
      bio: bio ? bio.trim() : '',
      ranking: '🌱 Rising Contributor',
      rankingPoints: initialPoints,
      projects: [],
      repositories: [],
    });

    return sendTokenResponse(user, 201, res, 'Signup successful!');
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    return sendTokenResponse(user, 200, res, 'Login successful!');
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const logout = async (req, res) => {
  res.cookie('token', '', { expires: new Date(0), maxAge: 0, httpOnly: true, sameSite: 'lax' });
  return res.json({ success: true, message: 'Logged out successfully.' });
};

const getMe = async (req, res) => {
  return res.json({ success: true, user: req.user });
};

const updateProfile = async (req, res) => {
  try {
    const { name, department, skills, bio, githubUrl, projects, repositories, githubStats, openToWork, upiId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (name) user.name = name.trim();
    if (department) user.department = department.trim();
    if (skills !== undefined) user.skills = Array.isArray(skills) ? skills.join(', ') : skills;
    if (bio !== undefined) user.bio = bio.trim();
    if (githubUrl !== undefined) {
      const trimmed = githubUrl.trim();
      user.githubUrl = trimmed ? (trimmed.startsWith('http') ? trimmed : `https://github.com/${trimmed.replace(/^@/, '')}`) : '';
    }
    if (upiId !== undefined) {
      user.upiId = upiId.trim();
    }
    if (projects !== undefined) user.projects = projects;
    if (repositories !== undefined) user.repositories = repositories;
    if (githubStats !== undefined) user.githubStats = githubStats;
    if (openToWork !== undefined) user.openToWork = Boolean(openToWork);

    // Dynamic ranking calculation based on real contributions & GitHub activity
    const projectScore = (user.projects?.length || 0) * 150;
    const repoScore = (user.repositories?.length || 0) * 100;
    const skillScore = (user.skills ? user.skills.split(',').filter(Boolean).length : 0) * 50;
    const starScore = Math.min((user.githubStats?.totalStars || 0) * 25, 600);
    const totalPoints = 500 + projectScore + repoScore + skillScore + starScore;
    user.rankingPoints = totalPoints;

    if (totalPoints >= 1500) user.ranking = '👑 Elite Open Source Champion';
    else if (totalPoints >= 1100) user.ranking = '🏆 Top 1% Master Contributor';
    else if (totalPoints >= 850) user.ranking = '⭐ Top 5% Senior Contributor';
    else if (totalPoints >= 650) user.ranking = '🚀 Top 10% Active Contributor';
    else user.ranking = '🌱 Rising Contributor';

    await user.save();
    return res.json({ success: true, message: 'Profile updated successfully!', user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendOtp, verifyOtp, signup, login, logout, getMe, updateProfile };
