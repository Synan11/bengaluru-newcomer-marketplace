const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsBase = path.join(__dirname, '..', '..', 'uploads');
const photosDir = path.join(uploadsBase, 'photos');
const idDocsDir = path.join(uploadsBase, 'id_docs');

// Ensure directories exist
if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
if (!fs.existsSync(idDocsDir)) fs.mkdirSync(idDocsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'id_doc') {
      cb(null, idDocsDir);
    } else {
      cb(null, photosDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}. Allowed: JPG, PNG, WEBP, PDF`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
