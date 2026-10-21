const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'chat');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate clean unique filename: originalBaseName-timestamp-random.ext
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// File filter for photos and common project documents
const fileFilter = (req, file, cb) => {
  // Allow all standard images, documents, code, and archive files
  const allowedExts = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|txt|rtf|csv|xls|xlsx|ppt|pptx|zip|rar|7z|json|js|jsx|ts|tsx|py|java|cpp|c|html|css|md/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  if (allowedExts.test(ext) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${ext} is not supported. Please upload an image, document, code, or zip file.`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
  },
});

module.exports = upload;
