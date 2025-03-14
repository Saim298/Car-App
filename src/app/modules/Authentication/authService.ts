import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { supabase, handleSupabaseError } from "../../config/supabase";
import { sendQrEmail } from "../../utils/mailer";
import { User, AuthResponse, SignupData } from "../../types/auth.types";

const SALT_ROUNDS = 10;
const UPLOAD_DIR = path.join(__dirname, "../../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const signupUser = async (email: string, password: string): Promise<AuthResponse> => {
  console.log("user received");

  try {
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error("Database Error (getUserByEmail):", userError);
      throw { status: 500, message: "Database error" };
    }

    if (existingUser) {
      throw { status: 400, message: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email,
          password: hashedPassword,
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Database Error (insertUser):", insertError);
      throw { status: 500, message: "Failed to create user" };
    }

    return {
      message: "User registered successfully.",
      email,
      id: newUser.id,
    };
  } catch (error) {
    console.error("Signup Error:", error);
    throw error;
  }
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
  

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      throw { status: 400, message: "User not found" };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw { status: 400, message: "Invalid credentials" };
    }

    const authToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return {
      message: "Login successful",
      token: authToken,
      id: user.id, // Ensure ID is included in response
    };
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

