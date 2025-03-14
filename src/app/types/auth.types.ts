export interface User {
  id: string;
  email: string;
  password: string;
  mfa_secret?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  userId?: string;
  email?: string;
  id?: string; 
  qrCodeUrl?: string;
}

export interface SignupData {
  id: string;
  email: string;
  password: string;
  mfaSecret: string;
} 