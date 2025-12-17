import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
// In Vercel/serverless, use /tmp (only writable location)
const uploadsDir = process.env.VERCEL === '1'
  ? '/tmp/uploads'
  : path.join(__dirname, '../../uploads');

// Ensure directory exists in all environments (including Vercel /tmp)
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (_) {}
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Guard: re-ensure path exists at runtime
    if (!fs.existsSync(uploadsDir)) {
      try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (_) {}
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'leads-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and Excel files are allowed'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
  }
});
