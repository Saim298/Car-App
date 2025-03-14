import express from "express";
import {
  createPlaidLinkToken,
  exchangePlaidToken,
  getPlaidAccounts,
  getPlaidTransactions,
  getPlaidIdentity,
} from "./plaid.controller";

const router = express.Router();

router.post("/create-link-token", createPlaidLinkToken);
router.post("/exchange-token", exchangePlaidToken);
router.post("/accounts", getPlaidAccounts);
router.post("/transactions", getPlaidTransactions);
router.post("/identity", getPlaidIdentity);
// access-sandbox-485f88ea-d932-41f5-8b98-9269e8e39bb4
export default router;
