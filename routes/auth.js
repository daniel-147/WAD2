import { Router } from "express";
import { loginPage, handleLogin, logout, registerPage, postRegister } from "../controllers/viewsController.js";
import { login as authLogin } from "../auth/auth.js";

const router = Router();

router.get("/login", loginPage);
router.post("/login", authLogin, handleLogin);
router.get("/logout", logout);

router.get("/register", registerPage);
router.post("/register", postRegister);

export default router;
