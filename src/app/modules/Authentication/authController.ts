import { Request, Response } from 'express';
import { signupUser,  loginUser } from './authService';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await signupUser(email, password);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// export const verifyMfa = async (req: Request, res: Response) => {
//   try {
//     const { email, token } = req.body;
//     const result = await verifyMfaToken(email, token);
//     res.status(200).json(result);
//   } catch (error: any) {
//     res.status(error.status || 500).json({ message: error.message });
//   }
// };

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};
