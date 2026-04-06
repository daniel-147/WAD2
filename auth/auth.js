// auth/auth.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "../loadEnv.js";
import { UserModel } from "../models/userModel.js";


export const login = async (req, res, next) => {
  try {
    const email = req.body?.email;
    const password = req.body?.password;

    // Missing credentials -> render login again
    if (!email || !password) {
      return res.status(400).render("login", {
        title: "Login",
        isLoggedIn: false,
        email: email || "",
        error: "Email and/or password incorrect",
        success: null,
        redirectTo: null,
      });
    }

    const user = await UserModel.findByEmail(email);


    if (!user || typeof user.password !== "string") {
      return res.status(403).render("login", {
        title: "Login",
        isLoggedIn: false,
        email,
        error: "Email and/or password incorrect",
        success: null,
        redirectTo: null,
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(403).render("login", {
        title: "Login",
        isLoggedIn: false,
        email,
        error: "Email and/or password incorrect",
        success: null,
        redirectTo: null,
      });
    }

    const payload = {
      email: user.email,
      id: user._id,
      role: user.role,
    };


    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: 300,
    });

    res.cookie("jwt", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 300 * 1000,
    });

    req.user = payload;
    return next();
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send("Internal Server Error");
  }
};


export const verify = (req, res, next) => {
  const accessToken = req.cookies?.jwt;

  if (!accessToken) {
    return res.status(403).send();
  }

  try {
    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).send();
  }
};


export const attachUser = (req, res, next) => {
  const accessToken = req.cookies?.jwt;
  if (!accessToken) return next();

  try {
    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = payload;
  } catch (_) {
    // ignore invalid/expired token for public routes
  }
  return next();
};