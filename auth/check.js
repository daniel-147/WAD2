// auth/auth.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "../loadEnv.js";
import { UserModel } from "../models/userModel.js";

/**
 * Login middleware (Lab 9 style, adapted to email identifier)
 */
export const login = async (req, res, next) => {
  try {
    const email = req.body?.email;
    const password = req.body?.password;

    if (!email || !password) {
      // Same behaviour pattern as lab: rerender login on missing creds
      return res.status(400).render("login", {
        title: "Login",
        isLoggedIn: false,
        email: email || "",
        error: "Email and/or password incorrect",
        success: null,
        redirectTo: null,
      });
    }

    const userRecord = await UserModel.findByEmail(email);

    if (!userRecord) {
      // Lab redirects to register view; your registration isn't implemented yet.
      // Keep consistent failure behaviour for now (Feature 4 requirement).
      return res.status(403).render("login", {
        title: "Login",
        isLoggedIn: false,
        email,
        error: "Email and/or password incorrect",
        success: null,
        redirectTo: null,
      });
    }

    if (!userRecord || typeof userRecord.password !== "string") {
      // Match lab's "malformed record" handling
      console.warn(`Malformed user record for ${email}:`, userRecord);
      return res.status(500).send("Internal Server Error");
    }

    const hashedPassword = userRecord.password;
    if (!hashedPassword) {
      console.warn(`No password hash stored for user ${email}`);
      return res.status(403).render("login", {
        title: "Login",
        isLoggedIn: false,
        email,
        error: "Email and/or password incorrect",
        success: null,
        redirectTo: null,
      });
    }

    const isValid = await bcrypt.compare(password, hashedPassword);

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

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      console.error("ACCESS_TOKEN_SECRET is not set");
      return res.status(500).send("Server misconfiguration");
    }

    // JWT payload (email identifier)
    const payload = { email, userId: userRecord._id };
    const accessToken = jwt.sign(payload, secret, { expiresIn: 300 });

    // Set cookie with secure defaults (same as lab)
    res.cookie("jwt", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 300 * 1000,
    });

    // Optional: make it available immediately in this request
    req.user = payload;

    return next();
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send("Internal Server Error");
  }
};

/**
 * Verify middleware (Lab 9 style)
 */
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

/**
 * DEVIATION from lab:
 * Non-blocking attachUser middleware for public SSR pages.
 */
export const attachUser = (req, res, next) => {
  const accessToken = req.cookies?.jwt;
  if (!accessToken) return next();

  try {
    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = payload;
  } catch (_) {
    // ignore invalid/expired for public pages
  }
  return next();
};