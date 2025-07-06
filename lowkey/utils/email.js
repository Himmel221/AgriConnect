// utils/email.js

import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, textContent, htmlContent) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASS
            }, tls: {
                rejectUnauthorized: false // bypass certificate verification
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text: textContent,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

export default sendEmail;
