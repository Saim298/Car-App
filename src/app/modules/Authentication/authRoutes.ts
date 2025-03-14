import { Router } from "express";
import { signup, login } from "./authController";

const router = Router();

router.post("/signup", signup);
// router.post("/verify-mfa", verifyMfa);
router.post("/login", login);

export default router;
