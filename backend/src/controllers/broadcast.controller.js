import nodemailer from 'nodemailer';
import User from '../models/user.model.js';
import Program from '../models/Program.js'; 
import BroadcastLog from '../models/broadcastLog.model.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. SEND BROADCAST (EMAIL ONLY) ---
export const sendBroadcast = async (req, res) => {
  try {
    const { audience, targetProgramIds, manualRecipients, csvRecipients, subject, message } = req.body;
    const currentUser = req.user; 

    let targets = []; 
    let programNames = [];

    // --- DETERMINE RECIPIENTS ---
    switch (audience) {
      case 'general':
        // Send to all Active Staff (or Dept specific if Dept Admin)
        let query = { status: 'Active' };
        if (currentUser.role === 'ADMIN') query.department = currentUser.department;
        const staff = await User.find(query).select('email');
        targets = staff.map(u => ({ email: u.email }));
        break;

      case 'manual':
        // Manual Entry List
        targets = (manualRecipients || []).map(email => ({ email }));
        break;

      case 'csv':
        // CSV Upload List
        targets = (csvRecipients || []).map(r => ({ email: r.email }));
        break;

      case 'program':
        // Participants of specific programs
        let progQuery = {};
        if (!targetProgramIds.includes('ALL_PROGRAMS')) progQuery._id = { $in: targetProgramIds };
        if (currentUser.role === 'ADMIN') progQuery.department = currentUser.department;

        const selectedPrograms = await Program.find(progQuery).populate('participants'); 
        selectedPrograms.forEach(prog => {
            programNames.push(prog.name);
            if (prog.participants && Array.isArray(prog.participants)) {
                // Handle both populated objects and legacy strings
                const participants = prog.participants.map(p => {
                    if (typeof p === 'string') return { email: p }; 
                    return { email: p.email };
                });
                targets.push(...participants);
            }
        });
        break;
      default:
        return res.status(400).json({ message: "Invalid audience type" });
    }

    // --- FILTER DUPLICATES & VALIDATE ---
    const uniqueEmails = [...new Set(targets.map(t => t.email).filter(e => e && e.includes('@')))];

    if (uniqueEmails.length === 0) {
        return res.status(400).json({ message: "No valid email recipients found." });
    }

    // --- EXECUTE SENDING (EMAIL ONLY) ---
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const logoPath = path.join(__dirname, '../../assets/logo.png');
        
        const mailOptions = {
            from: `"DOPALS TECHNOLOGIES" <${process.env.EMAIL_USER}>`,
            bcc: uniqueEmails, // Blind Copy for privacy
            subject: subject,
            attachments: [{ filename: 'logo.png', path: logoPath, cid: 'logo' }],
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { margin: 0; padding: 0; background-color: #F3F4F6; font-family: sans-serif; }
                        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
                        .header { background: #047857; padding: 30px; text-align: center; }
                        .content { padding: 40px 30px; color: #374151; line-height: 1.6; }
                        .footer { background: #F9FAFB; padding: 20px; text-align: center; font-size: 12px; color: #6B7280; }
                    </style>
                </head>
                <body>
                    <div style="padding: 20px;">
                        <div class="container">
                            <div class="header">
                                <img src="cid:logo" alt="Logo" style="width: 50px; background: white; padding: 5px; border-radius: 5px;"/>
                                <h2 style="color: white; margin: 10px 0 0 0; text-transform: uppercase; font-size: 18px;">Dopals Technologies</h2>
                            </div>
                            <div class="content">
                                <h2 style="color: #047857; margin-top: 0;">${subject}</h2>
                                <div>${message.replace(/\n/g, '<br>')}</div>
                                <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 30px 0;"/>
                                <p style="font-size: 12px; color: #9CA3AF; text-align: center;">
                                    This is an official broadcast from the Administration Team.
                                </p>
                            </div>
                            <div class="footer">
                                <p>Sent by <strong>${currentUser.name}</strong></p>
                                <p>&copy; ${new Date().getFullYear()} Dopals Technologies Ltd.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);

        // --- LOGGING ---
        await BroadcastLog.create({
            sender: currentUser._id,
            audienceType: audience,
            targetPrograms: programNames,
            subject,
            message,
            recipientCount: uniqueEmails.length,
            channels: ['email'] 
        });

        res.status(200).json({ 
            message: `Broadcast sent successfully to ${uniqueEmails.length} recipients.` 
        });

    } catch (err) {
        console.error("Email failed:", err);
        res.status(500).json({ message: "Failed to send emails via SMTP." });
    }

  } catch (error) {
    console.error("Broadcast Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// --- 2. GET BROADCAST HISTORY ---
export const getBroadcastHistory = async (req, res) => {
    try {
        const currentUser = req.user;
        let query = {};
        if (currentUser.role !== 'SUPER_ADMIN') {
            query.sender = currentUser._id;
        }
        const logs = await BroadcastLog.find(query)
            .populate('sender', 'name')
            .sort({ createdAt: -1 }); 
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};