import multer from 'multer';
import path from 'path';

// 1. Configure Storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Ensure this folder exists in your root
  },
  filename(req, file, cb) {
    // Generates: fieldname-timestamp.extension
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// 2. File Type Validator
function checkFileType(file, cb) {
  // ✅ Allowed file extensions
  const filetypes = /jpg|jpeg|png|webp|pdf|doc|docx|ppt|pptx|xls|xlsx/;
  
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  // Check mime type (Flexible check to avoid issues with some browsers/OS)
  const mimetype = filetypes.test(file.mimetype) || 
                   file.mimetype.includes('application/vnd') || // For Office docs
                   file.mimetype.includes('application/pdf') ||
                   file.mimetype.includes('image/');

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    // This was the error you saw in the terminal
    cb(new Error(`Error: Unsupported file type! Allowed: Images, PDF, Word, Excel, PowerPoint.`)); 
  }
}

// 3. Initialize Multer
export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Limit file size to 20MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});