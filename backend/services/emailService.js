const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const { escapeHtml } = require('../utils/escapeHtml');
require('dotenv').config();
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send booking confirmation after admin verifies UPI payment.
 * Includes itinerary and trip details when available.
 */
const sendBookingConfirmation = async (userEmail, userName, adventureTitle, bookingDetails = {}) => {
    try {
        if (!process.env.SMTP_USER) {
            const msg = 'SMTP not configured — cannot send booking confirmation email';
            if (process.env.NODE_ENV === 'production') {
                throw new Error(msg);
            }
            logger.warn(`${msg} (dev skip)`);
            return { skipped: true, reason: 'not_configured' };
        }

        const itinerary = Array.isArray(bookingDetails.itinerary) ? bookingDetails.itinerary : [];
        const included = Array.isArray(bookingDetails.included) ? bookingDetails.included : [];
        const excluded = Array.isArray(bookingDetails.excluded) ? bookingDetails.excluded : [];

        const itineraryHtml = itinerary.length
            ? `
                <h3 style="margin: 28px 0 12px; color: #2F4A3D; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Day-by-day itinerary</h3>
                <ol style="padding-left: 18px; margin: 0; color: #555; line-height: 1.55;">
                  ${itinerary.map((day) => `
                    <li style="margin-bottom: 12px;">
                      <strong>Day ${escapeHtml(day.day ?? '')}: ${escapeHtml(day.title || 'Schedule')}</strong>
                      ${day.description ? `<br/><span style="font-size: 14px;">${escapeHtml(day.description)}</span>` : ''}
                    </li>
                  `).join('')}
                </ol>
              `
            : '';

        const listHtml = (title, items) => items.length
            ? `
                <h3 style="margin: 24px 0 10px; color: #2F4A3D; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">${escapeHtml(title)}</h3>
                <ul style="padding-left: 18px; margin: 0; color: #555; font-size: 14px; line-height: 1.5;">
                  ${items.map((item) => `<li style="margin-bottom: 6px;">${escapeHtml(item)}</li>`).join('')}
                </ul>
              `
            : '';

        const safeName = escapeHtml(userName || 'Adventurer');
        const safeTitle = escapeHtml(adventureTitle);
        const safeCode = escapeHtml(bookingDetails.bookingCode || '—');
        const safeDate = escapeHtml(bookingDetails.date || '—');
        const safeParticipants = escapeHtml(bookingDetails.participants ?? '—');
        const safeAmount = escapeHtml(bookingDetails.amountPaid ?? '—');
        const safeLocation = escapeHtml(bookingDetails.location);
        const safeDuration = escapeHtml(bookingDetails.duration);
        const safeDifficulty = escapeHtml(bookingDetails.difficulty);
        const safeMeeting = escapeHtml(bookingDetails.meetingPoint);
        const html = `
            <div style="font-family: Arial, Helvetica, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #ebe4d8; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #2F4A3D; padding: 24px; text-align: center;">
                    <h1 style="color: #FAF7F1; margin: 0; font-size: 22px;">Phoenix Adventures</h1>
                    <p style="color: #C1622D; margin: 8px 0 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;">You're booked</p>
                </div>
                <div style="padding: 28px 24px; background-color: #ffffff;">
                    <h2 style="color: #2F4A3D; margin-top: 0; font-size: 20px;">Adventure booked successfully</h2>
                    <p style="color: #5c5a52; font-size: 16px; line-height: 1.55;">
                        Hi ${safeName},<br><br>
                        Your payment is verified and your seats are confirmed for
                        <strong>${safeTitle}</strong>. We can't wait to see you on the trail.
                    </p>

                    <div style="background-color: #FAF7F1; padding: 18px 20px; border-radius: 8px; margin: 22px 0; border: 1px solid #ebe4d8;">
                        <h3 style="margin-top: 0; color: #2F4A3D; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Booking details</h3>
                        <ul style="list-style: none; padding: 0; margin: 0; color: #5c5a52; font-size: 15px;">
                            <li style="margin-bottom: 8px;"><strong>Booking ID:</strong> ${safeCode}</li>
                            <li style="margin-bottom: 8px;"><strong>Adventure:</strong> ${safeTitle}</li>
                            <li style="margin-bottom: 8px;"><strong>Date:</strong> ${safeDate}</li>
                            <li style="margin-bottom: 8px;"><strong>Seats:</strong> ${safeParticipants}</li>
                            <li style="margin-bottom: 8px;"><strong>Amount paid:</strong> ₹${safeAmount}</li>
                            ${bookingDetails.location ? `<li style="margin-bottom: 8px;"><strong>Location:</strong> ${safeLocation}</li>` : ''}
                            ${bookingDetails.duration ? `<li style="margin-bottom: 8px;"><strong>Duration:</strong> ${safeDuration}</li>` : ''}
                            ${bookingDetails.difficulty ? `<li style="margin-bottom: 8px;"><strong>Difficulty:</strong> ${safeDifficulty}</li>` : ''}
                            ${bookingDetails.meetingPoint ? `<li style="margin-bottom: 8px;"><strong>Meeting point:</strong> ${safeMeeting}</li>` : ''}                        </ul>
                    </div>

                    ${itineraryHtml}
                    ${listHtml("What's included", included)}
                    ${listHtml('Not included', excluded)}

                    <p style="color: #5c5a52; font-size: 14px; line-height: 1.55; margin-top: 28px;">
                        Bring a valid government ID. Our team will share the exact reporting time on WhatsApp before departure.
                        Questions? Call <strong>+91 93725 06447</strong> / <strong>+91 77580 79726</strong>
                        or email <strong>pheonixadventuress@gmail.com</strong>.
                    </p>
                    <p style="color: #5c5a52; font-size: 14px; line-height: 1.55;">
                        See you on the ridge,<br><strong>Team Phoenix Adventures</strong>
                    </p>
                </div>
                <div style="background:#FAF7F1; padding: 14px; text-align:center; font-size: 12px; color:#7a776c;">
                    Est. 22 March 2023 · Sahyadris &amp; beyond
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Phoenix Adventures" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: `Adventure booked successfully: ${adventureTitle}`,
            html,
        });

        logger.info(`Booking confirmation email sent to ${userEmail}`);
        return { sent: true };
    } catch (error) {
        logger.error('Error sending booking confirmation email:', error);
        throw error;
    }
};

const sendAdminAlert = async (adminEmail, userName, adventureTitle, bookingDetails) => {
    try {
        if (!process.env.SMTP_USER) {
            const msg = 'SMTP not configured — cannot send admin alert';
            if (process.env.NODE_ENV === 'production') {
                throw new Error(msg);
            }
            logger.warn(`${msg} (dev skip)`);
            return { skipped: true, reason: 'not_configured' };
        }

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaec; padding: 20px;">
                <h2 style="color: #C1622D;">New Booking Alert</h2>
                <p><strong>${escapeHtml(userName)}</strong> just booked <strong>${escapeHtml(adventureTitle)}</strong>.</p>
                <ul style="list-style: none; padding: 0;">
                    <li><strong>Date:</strong> ${escapeHtml(bookingDetails.date)}</li>
                    <li><strong>Participants:</strong> ${escapeHtml(bookingDetails.participants)}</li>
                    <li><strong>Amount:</strong> ₹${escapeHtml(bookingDetails.amountPaid)}</li>
                </ul>
                <p>Check the admin dashboard for full details.</p>
            </div>
        `;
        await transporter.sendMail({
            from: `"Phoenix System" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: `New Booking: ${adventureTitle}`,
            html,
        });
        return { sent: true };
    } catch (error) {
        logger.error('Error sending admin alert email:', error);
        throw error;
    }
};

const sendPaymentSubmittedAlert = async (adminEmail, details) => {
    try {
        if (!process.env.SMTP_USER) {
            const msg = 'SMTP not configured — cannot send payment submitted alert';
            if (process.env.NODE_ENV === 'production') {
                throw new Error(msg);
            }
            logger.warn(`${msg} (dev skip)`);
            return { skipped: true, reason: 'not_configured' };
        }

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #C1622D;">Payment Submitted for Verification</h2>
                <p><strong>${escapeHtml(details.customerName)}</strong> submitted payment for <strong>${escapeHtml(details.adventureTitle)}</strong>.</p>
                <ul style="list-style: none; padding: 0;">
                    <li><strong>Booking ID:</strong> ${escapeHtml(details.bookingCode)}</li>
                    <li><strong>Amount:</strong> ₹${escapeHtml(details.amount)}</li>
                    <li><strong>UPI Reference:</strong> ${escapeHtml(details.upiReference)}</li>                </ul>
                <p>Please verify in your bank/UPI statement before confirming.</p>
            </div>
        `;

        await transporter.sendMail({
            from: `"Phoenix System" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: `Payment to verify: ${details.bookingCode}`,
            html,
        });
        return { sent: true };
    } catch (error) {
        logger.error('Error sending payment submitted alert:', error);
        throw error;
    }
};

const sendPaymentRejectedAlert = async (userEmail, userName, bookingCode, reason) => {
    try {
        if (!process.env.SMTP_USER) {
            const msg = 'SMTP not configured — cannot send payment rejected alert';
            if (process.env.NODE_ENV === 'production') {
                throw new Error(msg);
            }
            logger.warn(`${msg} (dev skip)`);
            return { skipped: true, reason: 'not_configured' };
        }

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Payment Could Not Be Verified</h2>
                <p>Hi ${escapeHtml(userName)},</p>
                <p>We could not verify your payment for booking <strong>${escapeHtml(bookingCode)}</strong>.</p>
                <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>                <p>Please contact us on WhatsApp or try booking again with the correct payment details.</p>
            </div>
        `;

        await transporter.sendMail({
            from: `"Phoenix Adventures" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: `Payment not verified: ${bookingCode}`,
            html,
        });
        return { sent: true };
    } catch (error) {
        logger.error('Error sending payment rejected alert:', error);
        throw error;
    }
};

const sendPasswordReset = async (userEmail, userName, resetLink) => {
    try {
        if (!process.env.SMTP_USER) {
            throw new Error('SMTP is not configured');
        }

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ebe4d8; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #2F4A3D; padding: 20px; text-align: center;">
                    <h1 style="color: #FAF7F1; margin: 0; font-size: 20px;">Phoenix Adventures</h1>
                </div>
                <div style="padding: 28px 24px;">
                    <h2 style="color: #2F4A3D; margin-top: 0;">Reset your password</h2>
                    <p style="color: #5c5a52; line-height: 1.5;">Hi ${escapeHtml(userName || 'there')},</p>
                    <p style="color: #5c5a52; line-height: 1.5;">Click the button below to set a new password. This link expires in 1 hour.</p>
                    <p style="text-align: center; margin: 28px 0;">
                        <a href="${escapeHtml(resetLink)}" style="display: inline-block; background: #C1622D; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">Reset password</a>
                    </p>
                    <p style="color: #7a776c; font-size: 13px; word-break: break-all;">Or copy this link:<br/>${escapeHtml(resetLink)}</p>                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Phoenix Adventures" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: 'Reset your Phoenix Adventures password',
            html,
        });

        logger.info(`Password reset email sent to ${userEmail}`);
    } catch (error) {
        logger.error('Error sending password reset email:', error);
        throw error;
    }
};

module.exports = {
    sendBookingConfirmation,
    sendAdminAlert,
    sendPaymentSubmittedAlert,
    sendPaymentRejectedAlert,
    sendPasswordReset,
};
