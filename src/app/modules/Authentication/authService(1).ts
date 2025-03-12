import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { insertUser, getUserByEmail } from "../../models/userModel";
import { sendQrEmail } from "../../utils/mailer";

import { v4 as uuidv4 } from "uuid";
const SALT_ROUNDS = 10;
const UPLOAD_DIR = path.join(__dirname, "../../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const signupUser = async (email: string, password: string) => {
    console.log("user recieved");
    
  return new Promise((resolve, reject) => {
    // Check if user already exists
    getUserByEmail(email, async (err, existingUser) => {
      if (err) {
        console.error("Database Error (getUserByEmail):", err);
        return reject({ status: 500, message: "Database error" });
      }
      if (existingUser) {
        return reject({ status: 400, message: "User already exists" });
      }

      try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Generate MFA secret
        const mfaSecret = speakeasy.generateSecret({ name: `MyApp (${email})` });

        // Insert new user into the database
        insertUser({ id: "", email, password: hashedPassword, mfaSecret: mfaSecret.base32 }, async (err, newUser) => {
          if (err) {
            console.error("Database Error (insertUser):", err);
            return reject({ status: 500, message: "Failed to create user" });
          }

          // Generate a unique filename for the QR code
          const qrFilePath = path.join(UPLOAD_DIR, `${uuidv4()}.png`);

          // Generate QR code image
          QRCode.toFile(qrFilePath, mfaSecret.otpauth_url || "", async (err: any) => {
            if (err) {
              console.error("QR Code Generation Error:", err);
              return reject({ status: 500, message: "QR Code generation failed" });
            }

            try {
              // Send QR code via email
              await sendQrEmail(email, qrFilePath);

              // Resolve with success response
              resolve({
                message: "User registered. Scan QR code for MFA setup.",
                email,
                qrCodeUrl: `/uploads/${path.basename(qrFilePath)}`, // Provide QR code path
              });
            } catch (emailError) {
              console.error("Email Error:", emailError);
              return reject({ status: 500, message: "Failed to send email" });
            }
          });
        });
      } catch (error) {
        console.error("Signup Error:", error);
        reject({ status: 500, message: "Internal server error" });
      }
    });
  });
};

// export const verifyMfaToken = async (email: string, token: string) => {
//     return new Promise((resolve, reject) => {
//       // Fetch user by email
//       getUserByEmail(email, (err, user) => {
//         if (err) {
//           console.error("Database Error (getUserByEmail):", err);
//           return reject({ status: 500, message: "Database error" });
//         }
//         if (!user) {
//           return reject({ status: 404, message: "User not found" });
//         }
  
//         // Verify the OTP token
//         const verified = speakeasy.totp.verify({
//           secret: user.mfaSecret, // Use the mfa_secret stored in the database
//           encoding: "base32", // Ensure the secret is encoded in base32
//           token: token, // OTP provided by the user
//           window: 1, // Allow a 1-step window for time-based OTPs
//         });
  
//         if (verified) {
//           // Generate a JWT token for the user
//           const authToken = jwt.sign(
//             { userId: user.id, email: user.email },
//             process.env.JWT_SECRET!, // Ensure JWT_SECRET is set in your environment
//             { expiresIn: "7d" } // Token expires in 7 days
//           );
  
//           // Resolve with success response
//           resolve({
//             message: "MFA Verification successful",
//             token: authToken,
//             userId: user.id,
//           });
//         } else {
//           // Reject if OTP is invalid
//           reject({ status: 400, message: "Invalid MFA code" });
//         }
//       });
//     });
//   };
  

export const loginUser = async (email: string, password: string) => {
  return new Promise((resolve, reject) => {
    getUserByEmail(email, async (err, user) => {
      if (err || !user) return reject({ status: 400, message: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return reject({ status: 400, message: "Invalid credentials" });

      const authToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: "7d" });
      resolve({ message: "Login successful", token: authToken, userId: user.id });
    });
  });
};
