require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const peerRoutes = require('./routes/peerRoutes');
const contactRoutes = require('./routes/contactRoutes');
const teamRoutes = require('./routes/teamRoutes');
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
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusCollab';
const { seedDefaultQuestionsIfNeeded } = require('./controllers/questionController');
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log(`MongoDB Connected`);
    await seedDefaultQuestionsIfNeeded().catch((err) => console.error('Question seed error:', err));
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error(`MongoDB error: ${err.message}`);
    process.exit(1);
  });
module.exports = app;
