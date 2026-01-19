import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).substring(1).toLowerCase();
    const rawFormats = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

    return {
      folder: 'dopals', 
      resource_type: rawFormats.includes(ext) ? 'raw' : 'auto', 
      format: rawFormats.includes(ext) ? ext : undefined, 
      public_id: `${file.fieldname}-${Date.now()}`,
    };
  },
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB Limit
});