import { Router } from "express";
import { loginPage, handleLogin, logout } from "../controllers/authController.js";
import { registerPage, postRegister } from "../controllers/registerController.js";
import { login as authLogin } from "../auth/auth.js";

const router = Router();

router.get("/login", loginPage);
router.post("/login", authLogin, handleLogin);
router.get("/logout", logout);

router.get("/register", registerPage);
router.post("/register", postRegister);

export default router;
