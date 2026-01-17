import cron from 'node-cron';
import nodemailer from 'nodemailer';
import User from '../models/user.model.js';

// CEO CONFIG
const CEO_EMAIL = 'kemuelobidah@gmail.com';
const WEDDING_MONTH = 10; // November (Months are 0-11 in JS Date, so Nov is 10)
const WEDDING_DAY = 1;

const sendWish = async (to, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        await transporter.sendMail({ from: `"Dopals Family" <${process.env.EMAIL_USER}>`, to, subject, html });
        console.log(`🎉 Wish sent to ${to}`);
    } catch (error) { console.error("Cron Email Error:", error); }
};

export const startCronJobs = () => {
    console.log("⏰ Secret Automation Engine Initialized...");

    // Run every day at 8:00 AM ('0 8 * * *')
    cron.schedule('0 8 * * *', async () => {
        const today = new Date();
        const currentMonth = today.getMonth(); // 0-11
        const currentDay = today.getDate();

        // --- TASK 1: BIRTHDAYS ---
        const users = await User.find({ status: 'Active' });
        users.forEach(user => {
            if (user.dob) {
                const dob = new Date(user.dob);
                if (dob.getMonth() === currentMonth && dob.getDate() === currentDay) {
                    sendWish(
                        user.email,
                        "Happy Birthday! 🎂",
                        `<div style="text-align:center;">
                           <h1 style="color:#059669;">Happy Birthday, ${user.name.split(' ')[0]}!</h1>
                           <p>Wishing you a fantastic day filled with joy.</p>
                           <p>- From all of us at Dopals Tech</p>
                        </div>`
                    );
                }
            }
        });

        // --- TASK 2: CEO WEDDING ANNIVERSARY ---
        if (currentMonth === WEDDING_MONTH && currentDay === WEDDING_DAY) {
            sendWish(
                CEO_EMAIL,
                "Happy Wedding Anniversary! 💍",
                `<div style="text-align:center;">
                   <h1 style="color:#E11D48;">Happy Anniversary, Sir!</h1>
                   <p>Wishing you and your spouse endless love and happiness.</p>
                   <p>- Your Dopals Tech Team</p>
                </div>`
            );
        }
    });
};