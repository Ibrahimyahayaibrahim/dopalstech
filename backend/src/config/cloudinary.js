// server/config/cloudinary.js

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // 👇 ✅ CHANGE THIS to match your Cloudinary folder name
    folder: 'dopals', 
    
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});