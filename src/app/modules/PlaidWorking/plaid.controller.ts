import { Request, Response } from 'express';
import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from 'plaid';
import dotenv from 'dotenv';

dotenv.config();

const plaidClient = new PlaidApi(
  new Configuration({
    basePath:
      PlaidEnvironments[
        process.env.PLAID_ENV as 'sandbox' | 'development' | 'production'
      ],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
        'PLAID-SECRET': process.env.PLAID_SECRET!,
      },
    },
  })
);

// Store user access tokens (In production, store in DB)
const userTokens: Record<string, string> = {};

// 1️⃣ Generate Link Token for Frontend
export const createPlaidLinkToken = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Your App',
      products: [Products.Transactions, Products.Auth], // Use the Products enum
      country_codes: [CountryCode.Us], // Use the CountryCode enum
      language: 'en',
    });

    res.json({ linkToken: response.data.link_token });
  } catch (error) {
    console.error('Error generating link token:', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
};

// 2️⃣ Exchange Public Token for Access Token
export const exchangePlaidToken = async (req: Request, res: Response) => {
  try {
    const { publicToken, userId } = req.body;

    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;

    userTokens[userId] = accessToken; // Store securely in production

    res.json({ success: true, accessToken });
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ error: 'Token exchange failed' });
  }
};

// 3️⃣ Fetch User's Accounts
export const getPlaidAccounts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const accessToken = userTokens[userId];

    if (!accessToken) return;

    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

// 4️⃣ Fetch Transactions Data
export const getPlaidTransactions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const accessToken = userTokens[userId];

    if (!accessToken) return;

    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: '2023-01-01',
      end_date: '2024-03-01',
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// 5️⃣ Fetch User Identity Information
export const getPlaidIdentity = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const accessToken = userTokens[userId];

    if (!accessToken) return;

    const response = await plaidClient.identityGet({
      access_token: accessToken,
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching identity:', error);
    res.status(500).json({ error: 'Failed to fetch identity information' });
  }
};
