import User from '../models/user.model.js';
import generateToken from '../utils/generateToken.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// --- CONFIGURE EMAIL TRANSPORTER ---
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, // Set in .env
    pass: process.env.EMAIL_PASS  // Set in .env
  }
});

// --- LOGIN USER ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ email });

    // 2. Validate Password
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        departments: user.departments,
        profilePicture: user.profilePicture,
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

// --- FORGOT PASSWORD (SEND EMAIL) ---
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save to DB (expires in 10 mins)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 
    await user.save({ validateBeforeSave: false }); // Skip validation for other fields

    // Create Reset Link
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Please click the link below to verify your identity.</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
      <p>This link expires in 10 minutes.</p>
    `;

    try {
      await transporter.sendMail({
        to: user.email,
        subject: 'Password Reset Request',
        html: message
      });

      res.status(200).json({ success: true, data: "Email sent" });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: "Email could not be sent" });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- RESET PASSWORD (CHANGE IT) ---
export const resetPassword = async (req, res) => {
  try {
    // Hash the incoming token to compare with DB
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() } // Ensure token is not expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update Password (Middleware will hash this automatically)
    user.password = req.body.password;
    
    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.status(200).json({ success: true, data: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};