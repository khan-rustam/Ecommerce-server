import 'dotenv/config';
import nodemailer from "nodemailer";
import process from 'node:process';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST_SMTP,
  port: Number(process.env.EMAIL_PORT_SMTP),
  secure: Number(process.env.EMAIL_PORT_SMTP) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_ADMIN,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (options: EmailOptions) => {
  const mailOptions = {
    from: `<${process.env.COMPANY_NAME}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

export { sendEmail };
