import nodemailer from "nodemailer";
import path from "path";

export const sendQrEmail = async (email: string, qrFilePath: string) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const qrCodeUrl = `http://your-backend-url/uploads/${path.basename(qrFilePath)}`;

  try {
    await transporter.sendMail({
      from: '"MyApp" <no-reply@myapp.com>',
      to: email,
      subject: "Your MFA QR Code",
      text: "Scan this QR code using an authenticator app",
      html: `<p>Scan this QR Code: <img src="${qrCodeUrl}" alt="QR Code" /></p>`,
    });
  } catch (error) {
    console.error("Email Sending Error:", error);
    throw new Error("Failed to send email");
  }
};