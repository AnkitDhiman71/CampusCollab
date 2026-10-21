const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    department: { type: String, default: 'General' },
    skills: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    openToWork: { type: Boolean, default: true },
    bio: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    ranking: { type: String, default: 'Top 10% Contributor' },
    rankingPoints: { type: Number, default: 850 },
    projects: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        tech: { type: String, default: '' },
        link: { type: String, default: '' },
      },
    ],
    repositories: [
      {
        name: { type: String, required: true },
        description: { type: String, default: '' },
        language: { type: String, default: 'JavaScript' },
        stars: { type: Number, default: 0 },
        forks: { type: Number, default: 0 },
        url: { type: String, default: '' },
        updatedAt: { type: String, default: '' },
      },
    ],
    githubStats: {
      username: { type: String, default: '' },
      avatarUrl: { type: String, default: '' },
      publicRepos: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
      totalStars: { type: Number, default: 0 },
      totalForks: { type: Number, default: 0 },
      topLanguages: [{ type: String }],
      streakUrl: { type: String, default: '' },
      lastSynced: { type: Date },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
