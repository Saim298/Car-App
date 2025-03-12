import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../../config/superbase";
import { sendQrEmail } from "../../utils/mailer";

const SALT_ROUNDS = 10;
const UPLOAD_DIR = path.join(__dirname, "../../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Get user by email using Supabase
const getUserByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (error) {
      console.error("Error getting user by email:", error);
      
      // Check for RLS error
      if (error.code === '42501' && error.message.includes('row-level security policy')) {
        console.error("Row Level Security (RLS) is preventing the select operation.");
        console.error("Run this SQL in the Supabase SQL Editor to fix it:");
        console.error("ALTER TABLE users DISABLE ROW LEVEL SECURITY;");
        console.error("GRANT ALL PRIVILEGES ON TABLE users TO anon, authenticated;");
      }
      
      throw error;
    }
    
    // Return the first user or null if no user found
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw error;
  }
};

// Insert user using Supabase
const insertUser = async (userData: { email: string, password: string, mfaSecret: string }) => {
  try {
    const id = uuidv4();
    
    // Create user object with only the fields that exist in the table
    const userObject = {
      id,
      email: userData.email,
      password: userData.password,
      mfa_secret: userData.mfaSecret
    };
    
    console.log("Inserting user with data:", userObject);
    
    const { data, error } = await supabase
      .from('users')
      .insert([userObject])
      .select();
    
    if (error) {
      console.error("Supabase insert error:", error);
      
      // Check for RLS error
      if (error.code === '42501' && error.message.includes('row-level security policy')) {
        console.error("Row Level Security (RLS) is preventing the insert operation.");
        console.error("Run this SQL in the Supabase SQL Editor to fix it:");
        console.error("ALTER TABLE users DISABLE ROW LEVEL SECURITY;");
        console.error("GRANT ALL PRIVILEGES ON TABLE users TO anon, authenticated;");
      }
      
      throw error;
    }
    
    // Return the inserted user with id
    return data && data.length > 0 ? data[0] : { id, ...userData };
  } catch (error) {
    console.error("Error inserting user:", error);
    throw error;
  }
};

export const signupUser = async (email: string, password: string) => {
  console.log("user received");
  
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      return Promise.reject({ status: 400, message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate MFA secret
    const mfaSecret = speakeasy.generateSecret({ name: `MyApp (${email})` });

    // Insert new user into the database
    const newUser = await insertUser({ 
      email, 
      password: hashedPassword, 
      mfaSecret: mfaSecret.base32 
    });

    // Generate a unique filename for the QR code
    const qrFilePath = path.join(UPLOAD_DIR, `${uuidv4()}.png`);

    // Generate QR code image
    await new Promise<void>((resolve, reject) => {
      QRCode.toFile(qrFilePath, mfaSecret.otpauth_url || "", (err: any) => {
        if (err) {
          console.error("QR Code Generation Error:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Send QR code via email
    await sendQrEmail(email, qrFilePath);

    // Return success response
    return {
      message: "User registered. Scan QR code for MFA setup.",
      email,
      qrCodeUrl: `/uploads/${path.basename(qrFilePath)}`, // Provide QR code path
    };
  } catch (error) {
    console.error("Signup Error:", error);
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    // Get user by email
    const user = await getUserByEmail(email);
    
    if (!user) {
      return Promise.reject({ status: 400, message: "User not found" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return Promise.reject({ status: 400, message: "Invalid credentials" });
    }

    // Generate JWT token
    const authToken = jwt.sign(
      { userId: user.id, email: user.email }, 
      process.env.JWT_SECRET!, 
      { expiresIn: "7d" }
    );

    // Return success response
    return { 
      message: "Login successful", 
      token: authToken, 
      userId: user.id 
    };
  } catch (error) {
    console.error("Login Error:", error);
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

export const verifyMfaToken = async (email: string, token: string) => {
  try {
    // Fetch user by email
    const user = await getUserByEmail(email);
    
    if (!user) {
      return Promise.reject({ status: 404, message: "User not found" });
    }

    // Get the MFA secret, handling different possible field names
    const mfaSecret = user.mfa_secret || user.mfaSecret;
    
    if (!mfaSecret) {
      console.error("MFA secret not found in user record:", user);
      return Promise.reject({ status: 500, message: "MFA not set up for this user" });
    }

    // Verify the OTP token
    const verified = speakeasy.totp.verify({
      secret: mfaSecret,
      encoding: "base32", // Ensure the secret is encoded in base32
      token: token, // OTP provided by the user
      window: 1, // Allow a 1-step window for time-based OTPs
    });

    if (verified) {
      // Generate a JWT token for the user
      const authToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!, // Ensure JWT_SECRET is set in your environment
        { expiresIn: "7d" } // Token expires in 7 days
      );

      // Return success response
      return {
        message: "MFA Verification successful",
        token: authToken,
        userId: user.id,
      };
    } else {
      // Reject if OTP is invalid
      return Promise.reject({ status: 400, message: "Invalid MFA code" });
    }
  } catch (error) {
    console.error("MFA Verification Error:", error);
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

// Function to check the structure of the users table
export const checkUsersTable = async () => {
  try {
    console.log("Checking users table structure...");
    
    // First try to get the table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error("Error querying users table:", tableError);
      console.log("If you're seeing permission errors, you may need to disable Row Level Security (RLS) for the users table.");
      console.log("Run this SQL in the Supabase SQL Editor:");
      console.log("ALTER TABLE users DISABLE ROW LEVEL SECURITY;");
      console.log("GRANT ALL PRIVILEGES ON TABLE users TO anon, authenticated;");
    } else {
      console.log("Users table sample data:", tableInfo);
    }
    
    return { success: tableError ? false : true, error: tableError };
  } catch (error) {
    console.error("Error in checkUsersTable:", error);
    return { success: false, error };
  }
};

// Call this function when the module is loaded
checkUsersTable().then(result => {
  if (result.success) {
    console.log("Successfully checked users table structure");
  } else {
    console.log("Failed to check users table structure");
    console.log("Please ensure the users table exists and has the correct structure:");
    console.log(`
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  mfa_secret TEXT
);

-- Disable Row Level Security
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Grant privileges
GRANT ALL PRIVILEGES ON TABLE users TO anon, authenticated;
    `);
  }
});
