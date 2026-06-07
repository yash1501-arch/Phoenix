const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
require('dotenv').config();

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send booking confirmation email to the user
 */
const sendBookingConfirmation = async (userEmail, userName, adventureTitle, bookingDetails) => {
    try {
        if (!process.env.SMTP_USER) return; // Skip if no email config

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaec; border-radius: 10px; overflow: hidden;">
                <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
                    <h1 style="color: #D4AF37; margin: 0; font-size: 24px;">Phoenix Adventures</h1>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2 style="color: #333333; margin-top: 0;">Booking Confirmed! 🎉</h2>
                    <p style="color: #555555; font-size: 16px; line-height: 1.5;">
                        Hi ${userName},<br><br>
                        Your adventure is confirmed! We are thrilled to have you join us for <strong>${adventureTitle}</strong>.
                    </p>
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <h3 style="margin-top: 0; color: #333; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Booking Summary</h3>
                        <ul style="list-style: none; padding: 0; margin: 0; color: #555;">
                            <li style="margin-bottom: 10px;"><strong>Date:</strong> ${bookingDetails.date}</li>
                            <li style="margin-bottom: 10px;"><strong>Participants:</strong> ${bookingDetails.participants}</li>
                            <li style="margin-bottom: 10px;"><strong>Amount Paid:</strong> ₹${bookingDetails.amountPaid}</li>
                        </ul>
                    </div>
                    <p style="color: #555555; font-size: 14px; line-height: 1.5;">
                        Please bring a valid government ID (the one you provided during booking). Our team will contact you shortly with the exact meeting point and time.
                    </p>
                    <p style="color: #555555; font-size: 14px; line-height: 1.5;">
                        Get ready for an unforgettable experience!<br><br>
                        Cheers,<br><strong>Team Phoenix</strong>
                    </p>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Phoenix Adventures" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: `Booking Confirmed: ${adventureTitle}`,
            html: html,
        });

        logger.info(`Booking confirmation email sent to ${userEmail}`);
    } catch (error) {
        logger.error('Error sending booking confirmation email:', error);
    }
};

/**
 * Send new booking alert to admin
 */
const sendAdminAlert = async (adminEmail, userName, adventureTitle, bookingDetails) => {
    try {
        if (!process.env.SMTP_USER) return;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaec; padding: 20px;">
                <h2 style="color: #D4AF37;">New Booking Alert! 🚀</h2>
                <p><strong>${userName}</strong> just booked <strong>${adventureTitle}</strong>.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <ul style="list-style: none; padding: 0;">
                    <li><strong>Date:</strong> ${bookingDetails.date}</li>
                    <li><strong>Participants:</strong> ${bookingDetails.participants}</li>
                    <li><strong>Amount Paid:</strong> ₹${bookingDetails.amountPaid}</li>
                    <li><strong>ID Type:</strong> ${bookingDetails.idType}</li>
                    <li><strong>ID Number:</strong> ${bookingDetails.idNumber}</li>
                </ul>
                <p>Check the admin dashboard for full details.</p>
            </div>
        `;

        await transporter.sendMail({
            from: `"Phoenix System" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: `🚨 New Booking: ${adventureTitle}`,
            html: html,
        });

        logger.info('Admin alert email sent');
    } catch (error) {
        logger.error('Error sending admin alert email:', error);
    }
};

module.exports = {
    sendBookingConfirmation,
    sendAdminAlert
};
