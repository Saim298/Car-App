import { v4 as uuidv4 } from "uuid";
import db from "../config/db";

export interface User {
  id: string;
  email: string;
  password: string;
  mfaSecret: string | null;
}

export const createUserTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      mfaSecret VARCHAR(255) NULL
    )
  `;

  db.query(query, (err: any) => {
    if (err) console.error("Error creating user table:", err);
    else console.log("User table created or already exists");
  });
};

export const insertUser = (user: User, callback: (err: any, result?: any) => void) => {
  const query = "INSERT INTO users (id, email, password, mfaSecret) VALUES (?, ?, ?, ?)";
  db.query(query, [uuidv4(), user.email, user.password, user.mfaSecret], callback);
};

export const getUserByEmail = (email: string, callback: (err: any, result?: User) => void) => {
  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], (err: any, results: string | any[]) => {
    if (err) return callback(err);
    callback(null, results.length ? results[0] : null);
  });
};
