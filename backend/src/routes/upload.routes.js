import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure Storage (Save to 'uploads/' folder)
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists in your backend root!
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Upload Endpoint
router.post('/', upload.single('file'), (req, res) => {
  try {
    // Return the path that the frontend can save
    // Assuming you serve 'uploads' statically in server.js
    const filePath = `/uploads/${req.file.filename}`;
    res.send(filePath);
  } catch (err) {
    res.status(400).send({ message: 'File upload failed' });
  }
});

export default router;