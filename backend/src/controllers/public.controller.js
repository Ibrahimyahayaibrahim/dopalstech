import Participant from '../models/Participant.js';
import Program from '../models/Program.js';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. GET PUBLIC PROGRAM DETAILS ---
export const getPublicProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id)
      // ADDED: registrationOpen, registrationDeadline
      .select('name type date description venue flyer participantsCount status registrationOpen registrationDeadline');
      
    if (!program) {
        return res.status(404).json({ message: "Program not found or closed" });
    }
    res.json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 2. REGISTER PARTICIPANT ---
export const registerParticipant = async (req, res) => {
  try {
    const { programId } = req.params;
    
    // 1. Find Program First to check status
    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    // --- NEW: CHECK REGISTRATION STATUS ---
    // A. Manual Close
    if (program.registrationOpen === false) {
        return res.status(403).json({ message: "Registration for this event is currently closed by the admin." });
    }

    // B. Deadline Check
    if (program.registrationDeadline) {
        const now = new Date();
        const deadline = new Date(program.registrationDeadline);
        if (now > deadline) {
            return res.status(403).json({ message: "Registration closed on " + deadline.toLocaleString() });
        }
    }
    // --------------------------------------

    const { 
        fullName, email, phone, ageGroup, consent,
        gender, organization, state, referralSource 
    } = req.body;

    if (!consent) return res.status(400).json({ message: "Consent is required" });
    if (!email && !phone) return res.status(400).json({ message: "Please provide Email or Phone" });

    let query = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone });

    let participant = await Participant.findOne({ $or: query });

    if (participant) {
      if (fullName) participant.fullName = fullName;
      if (ageGroup) participant.ageGroup = ageGroup;
      if (email && !participant.email) participant.email = email;
      if (phone && !participant.phone) participant.phone = phone;
      if (gender) participant.gender = gender;
      if (organization) participant.organization = organization;
      if (state) participant.state = state;
      if (referralSource) participant.referralSource = referralSource;
      
      if (participant.programs.includes(programId)) {
        return res.status(400).json({ message: "You are already registered for this program!" });
      }
      participant.programs.push(programId);
      await participant.save();
    } else {
      participant = await Participant.create({
        fullName, email, phone, ageGroup, consent,
        gender, organization, state, referralSource,
        programs: [programId]
      });
    }

    await Program.findByIdAndUpdate(programId, {
      $addToSet: { participants: participant._id }
    });

    // --- SEND DIGITAL TICKET EMAIL ---
    if (email) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });

            const eventDate = program.date ? new Date(program.date).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
            }) : 'Date To Be Announced';

            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${participant._id}&color=059669`;
            const logoPath = path.join(__dirname, '../../assets/logo.png');

            const mailOptions = {
                from: `"DOPALS TECHNOLOGIES LTD" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `🎟️ Your Ticket: ${program.name}`,
                attachments: [{ filename: 'logo.png', path: logoPath, cid: 'logo' }],
                html: `
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 0;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            
                            <div style="background-color: #10b981; padding: 25px 30px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="width: 70px; padding-right: 15px; vertical-align: middle;">
                                            <img src="cid:logo" alt="Dopals Logo" style="width: 60px; height: auto; background: white; padding: 5px; border-radius: 8px; display: block;" />
                                        </td>
                                        <td style="vertical-align: middle; text-align: left;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px; font-weight: 800; line-height: 1.2;">DOPALS TECHNOLOGIES LTD</h1>
                                            <p style="color: #ecfdf5; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Official Event Pass</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <div style="padding: 40px 30px; border-bottom: 2px dashed #e5e7eb;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Event Registration</p>
                                <h2 style="color: #111827; font-size: 28px; margin: 0 0 20px 0; line-height: 1.2;">${program.name}</h2>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 5px 0;"><strong>Date:</strong> ${eventDate}</p>
                                <p style="color: #374151; font-size: 16px; margin: 0;"><strong>Location:</strong> ${program.venue || 'Venue TBD'}</p>
                            </div>

                            <div style="padding: 30px; background-color: #f9fafb;">
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="vertical-align: middle;">
                                            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0; font-weight: bold; text-transform: uppercase;">Attendee</p>
                                            <p style="color: #10b981; font-size: 20px; margin: 0 0 5px 0; font-weight: bold;">${fullName}</p>
                                            <p style="color: #6b7280; font-size: 14px; margin: 0;">${organization || 'Individual'}</p>
                                        </td>
                                        <td style="text-align: right; vertical-align: middle;">
                                            <img src="${qrCodeUrl}" alt="Ticket QR" style="border: 4px solid #ffffff; border-radius: 8px;" width="100" height="100" />
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <div style="background-color: #1f2937; padding: 20px; text-align: center;">
                                <p style="color: #4b5563; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} DOPALS TECHNOLOGIES LTD. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };
            transporter.sendMail(mailOptions).catch(err => console.error("Email send failed:", err));
        } catch (emailErr) { console.error("Email setup failed:", emailErr); }
    }
    res.status(201).json({ message: "Registration successful!", participantId: participant._id });
  } catch (error) {
    console.error("Registration Error:", error);
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    res.status(500).json({ message: "Server error during registration" });
  }
};