require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // fallback to system resolver
}
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const peerRoutes = require('./routes/peerRoutes');
const contactRoutes = require('./routes/contactRoutes');
const teamRoutes = require('./routes/teamRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const { securityLogger } = require('./middlewares/securityLoggerMiddleware')
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Intercept all requests for security inspection & technical threat telemetry
app.use(securityLogger);
// Serve static uploaded files (chat attachments, photos, documents)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/peers', peerRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rewards', rewardRoutes);
// Serve static frontend files in production if frontend/dist exists
const fs = require('fs');
const os = require('os');
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.json({ 
    success: true, 
    message: 'CampusCollab Backend API Running',
    workerContainerId: os.hostname(),
    timestamp: new Date().toISOString()
  }));
}

// 404 handler for unmatched API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusCollab';
const { seedDefaultQuestionsIfNeeded } = require('./controllers/questionController');

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

let isDbConnected = false;
const connectDatabaseWithRetry = async (retryCount = 0) => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      family: 4,
    });
    isDbConnected = true;
    console.log(`✓ MongoDB Connected Successfully`);
    await seedDefaultQuestionsIfNeeded().catch((err) => console.error('Question seed error:', err.message));
  } catch (err) {
    console.warn(`[MongoDB Warning] Connection attempt #${retryCount + 1} failed (${err.message}). Retrying in 5 seconds...`);
    // Attempt fallback to local mongodb if Atlas SRV continues to fail after 3 tries
    if (retryCount >= 2 && MONGO_URI.includes('mongodb+srv://') && !isDbConnected) {
      try {
        console.log(`[MongoDB Fallback] Testing local database fallback at mongodb://127.0.0.1:27017/campusCollab...`);
        await mongoose.connect('mongodb://127.0.0.1:27017/campusCollab', { serverSelectionTimeoutMS: 3000 });
        isDbConnected = true;
        console.log(`✓ Connected to Local MongoDB database fallback.`);
        await seedDefaultQuestionsIfNeeded().catch(() => {});
        return;
      } catch (localErr) {}
    }
    setTimeout(() => connectDatabaseWithRetry(retryCount + 1), 5000);
  }
};

// Start Express server immediately so nodemon does not crash
app.listen(PORT, () => {
  console.log(`CampusCare Server running on http://localhost:${PORT}`);
  connectDatabaseWithRetry();
});

module.exports = app;

