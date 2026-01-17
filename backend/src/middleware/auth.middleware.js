import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// --- 1. PROTECT (Authentication & Status Check) ---
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 1. Get token
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Fetch user (Exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      // 4. Check if user exists (Integrity check)
      if (!req.user) {
         return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // 5. CRITICAL: ZOMBIE KILL SWITCH
      // If user is suspended, reject even if token is valid
      if (req.user.status === 'Suspended') {
          return res.status(403).json({ message: 'Access denied: Account suspended' });
      }

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      // Differentiate between expired token and invalid token if needed, 
      // but generic 401 is safer for production security.
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// --- 2. AUTHORIZE (Role-Based Access Control) ---
export const authorize = (...roles) => {
  return (req, res, next) => {
    // 1. Fail safe: if protect() failed to load user
    if (!req.user) {
        return res.status(401).json({ message: 'User context missing' });
    }

    // 2. Check Role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Role '${req.user.role}' is not authorized` 
      });
    }
    
    next();
  };
};