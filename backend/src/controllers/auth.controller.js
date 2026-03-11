import User from '../models/user.model.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';
import { sendEmail } from '../services/email.service.js'; 

// --- LOGIN USER ---
// Validates credentials and returns a JWT for authenticated sessions
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ email });

    // 2. Validate Password via model method
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
        token: generateToken(user._id), // Returns JWT
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server Error during login' });
  }
};

// --- FORGOT PASSWORD ---
// Generates a temporary reset token and dispatches it via Brevo SMTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Security note: In a high-security environment, you might return 200 
      // even if user isn't found to prevent "account enumeration."
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Generate random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash token and set expiry (10 minutes)
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 

    // 3. Save to DB without triggering full validation (since profile might be incomplete)
    await user.save({ validateBeforeSave: false });

    // 4. Construct Reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const messageHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 600px; margin: auto; color: #1f2937;">
        <h2 style="color: #059669; margin-bottom: 20px;">Password Reset Request</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>We received a request to reset the password for your Dopals Tech account. If this was you, click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
           <a href="${resetUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset My Password</a>
        </div>
        <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
          This link is valid for <strong>10 minutes</strong>. After that, you will need to request a new one.
          <br><br>
          If you did not request this change, please ignore this email. Your password will remain unchanged.
        </p>
        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 20px 0;">
        <p style="font-size: 11px; color: #9ca3af; text-align: center;">Dopals Tech Management System | Secure Identity Services</p>
      </div>
    `;

    try {
      // 5. Dispatch Email via Brevo
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request - Dopals Tech',
        html: messageHtml,
        text: `You requested a password reset. Please use the following link: ${resetUrl}` 
      });

      res.status(200).json({ success: true, data: "Reset email sent successfully" });
    } catch (emailError) {
      console.error("Email Dispatch Failed:", emailError);
      
      // Clear token fields if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({ message: "System error: Could not send reset email" });
    }

  } catch (error) {
    console.error("Forgot Password Controller Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- RESET PASSWORD ---
// Validates the hashed token and updates the user's password
export const resetPassword = async (req, res) => {
  try {
    // 1. Hash the incoming token from URL to compare with stored hash
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    // 2. Find user with valid, non-expired token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // 3. Set the new password (middleware will handle hashing)
    user.password = req.body.password;
    
    // 4. Clear reset fields to prevent reuse
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.status(200).json({ success: true, data: "Password has been reset successfully. You can now login." });
  } catch (error) {
    console.error("Reset Password Controller Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};