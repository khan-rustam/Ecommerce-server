const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST_SMTP,
    port: Number(process.env.EMAIL_PORT_SMTP),
    secure: Number(process.env.EMAIL_PORT_SMTP) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_ADMIN,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendEmail({ to, subject, text, html }) {
    let info = await transporter.sendMail({
        from: `<${process.env.EMAIL_ADMIN}>`,
        to,
        subject,
        text,
        html,
    });
    console.log('Message sent: %s', info.messageId);
}

module.exports = { sendEmail };