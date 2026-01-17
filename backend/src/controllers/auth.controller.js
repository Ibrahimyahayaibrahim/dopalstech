import User from '../models/user.model.js';
import generateToken from '../utils/generateToken.js'; // Assuming you have this util

// --- LOGIN USER ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ email });

    // 2. Validate Password
    if (user && (await user.matchPassword(password))) {
      
      // ✅ CRITICAL FIX: Return ALL status flags
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        departments: user.departments,
        profilePicture: user.profilePicture,
        
        // These are the keys to the kingdom:
        isProfileComplete: user.isProfileComplete, 
        status: user.status, 
        forcePasswordReset: user.forcePasswordReset,

        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};